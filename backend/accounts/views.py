import secrets
import smtplib
from datetime import timedelta
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, UserRole, Device, PasswordResetOTP
from .serializers import (
    CustomerRegistrationSerializer,
    LoginSerializer,
    UserSerializer,
    ForgotPasswordSerializer,
    VerifyOTPSerializer,
    ResetPasswordSerializer,
)
from .permissions import IsCustomer, IsCafeOwner, IsCafeWorker, IsSystemAdmin

signer = TimestampSigner(salt='password-reset-salt')


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def set_auth_cookies(response, access_token: str, refresh_token: str = None):
    # Cookie security settings
    secure = not settings.DEBUG
    samesite = 'Lax'

    response.set_cookie(
        key='access_token',
        value=str(access_token),
        max_age=15 * 60,  # 15 minutes
        httponly=True,
        secure=secure,
        samesite=samesite,
        path='/'
    )
    if refresh_token:
        response.set_cookie(
            key='refresh_token',
            value=str(refresh_token),
            max_age=24 * 3600,  # 24 hours
            httponly=True,
            secure=secure,
            samesite=samesite,
            path='/'
        )


class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = get_token(request)
        return Response({"csrfToken": token})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "Registration successful. You can now log in.",
                    "user": UserSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']
        device_id = serializer.validated_data['device_id'].strip()
        device_name = serializer.validated_data.get('device_name', 'Browser')

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            user = None

        # Check account lockout (Brute Force Protection)
        if user and user.is_locked_out:
            remaining = user.remaining_lockout_seconds()
            return Response(
                {
                    "detail": f"Account temporarily locked due to repeated failed login attempts. Please wait {remaining} seconds before trying again.",
                    "code": "account_locked",
                    "lockout_seconds": remaining
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Verify password
        if user is None or not user.check_password(password):
            if user:
                user.failed_login_attempts += 1
                user.last_failed_login = timezone.now()
                max_attempts = getattr(settings, 'MAX_FAILED_LOGIN_ATTEMPTS', 5)
                lockout_minutes = getattr(settings, 'LOGIN_LOCKOUT_MINUTES', 5)

                if user.failed_login_attempts >= max_attempts:
                    user.lockout_until = timezone.now() + timedelta(minutes=lockout_minutes)
                    user.failed_login_attempts = 0
                    user.save(update_fields=['failed_login_attempts', 'last_failed_login', 'lockout_until'])
                    remaining = int(timedelta(minutes=lockout_minutes).total_seconds())
                    return Response(
                        {
                            "detail": f"Account temporarily locked due to repeated failed login attempts. Please wait {remaining} seconds before trying again.",
                            "code": "account_locked",
                            "lockout_seconds": remaining
                        },
                        status=status.HTTP_429_TOO_MANY_REQUESTS
                    )
                else:
                    user.save(update_fields=['failed_login_attempts', 'last_failed_login'])

            # Generic error message to prevent account enumeration
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"detail": "This account is inactive. Please contact an administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Successful credential match: reset brute-force counters
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.last_activity = timezone.now()
        user.save(update_fields=['failed_login_attempts', 'lockout_until', 'last_activity'])

        # Device limit enforcement
        client_ip = get_client_ip(request)
        device = Device.objects.filter(user=user, device_id=device_id).first()

        if device:
            if not device.is_active:
                # Device was revoked by admin: check if adding it back exceeds limit
                active_count = Device.objects.filter(user=user, is_active=True).count()
                if active_count >= user.allowed_devices:
                    return Response(
                        {
                            "detail": f"Device limit reached. You can only use this account on up to {user.allowed_devices} registered device(s). Contact an administrator to reset or increase your device limit.",
                            "code": "device_limit_reached",
                            "allowed_devices": user.allowed_devices,
                            "active_devices": active_count
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                device.is_active = True
            device.device_name = device_name
            device.ip_address = client_ip
            device.save()
        else:
            # New device attempting to log in
            active_count = Device.objects.filter(user=user, is_active=True).count()
            if active_count >= user.allowed_devices:
                return Response(
                    {
                        "detail": f"Device limit reached. You can only use this account on up to {user.allowed_devices} registered device(s). Contact an administrator to reset or increase your device limit.",
                        "code": "device_limit_reached",
                        "allowed_devices": user.allowed_devices,
                        "active_devices": active_count
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            Device.objects.create(
                user=user,
                device_id=device_id,
                device_name=device_name,
                ip_address=client_ip,
                is_active=True
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        response = Response(
            {
                "message": "Login successful.",
                "user": UserSerializer(user).data
            },
            status=status.HTTP_200_OK
        )
        set_auth_cookies(response, str(access_token), str(refresh))
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            user.last_activity = None
            user.save(update_fields=['last_activity'])

        # Blacklist refresh token if provided
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        response = Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK
        )
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        return response


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "user": UserSerializer(request.user).data
        })


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response(
                {"detail": "Refresh token cookie missing."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            token = RefreshToken(refresh_token)
            user_id = token.payload.get('user_id')
            user = User.objects.get(id=user_id)
            if not user.is_active:
                raise TokenError("User inactive")

            # Inactivity check
            timeout_seconds = getattr(settings, 'INACTIVITY_TIMEOUT_SECONDS', 180)
            if user.last_activity:
                elapsed = (timezone.now() - user.last_activity).total_seconds()
                if elapsed > timeout_seconds:
                    user.last_activity = None
                    user.save(update_fields=['last_activity'])
                    response = Response(
                        {"detail": "Session expired due to 3 minutes of inactivity. Please log in again.", "code": "session_expired"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                    response.delete_cookie('access_token', path='/')
                    response.delete_cookie('refresh_token', path='/')
                    return response

            user.last_activity = timezone.now()
            user.save(update_fields=['last_activity'])

            # Rotate tokens
            new_access_token = token.access_token
            token.blacklist()
            new_refresh = RefreshToken.for_user(user)

            response = Response({"message": "Token refreshed successfully."})
            set_auth_cookies(response, str(new_access_token), str(new_refresh))
            return response
        except (TokenError, User.DoesNotExist):
            response = Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie('access_token', path='/')
            response.delete_cookie('refresh_token', path='/')
            return response


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        student_id = serializer.validated_data['student_id'].strip()
        user = User.objects.filter(student_id__iexact=student_id, is_active=True).first()

        # Confirmation message that avoids account enumeration and never exposes the full email
        generic_msg = (
            "If an account matches the provided Student ID, an OTP has been sent to its registered email address. "
            "The OTP is valid for 5 minutes."
        )

        if user:
            # Rate limiting: prevent spamming OTP requests (minimum 60s between requests)
            recent_otp = PasswordResetOTP.objects.filter(user=user).order_by('-created_at').first()
            if recent_otp and (timezone.now() - recent_otp.created_at).total_seconds() < 60:
                return Response(
                    {"detail": "Please wait at least 60 seconds before requesting another OTP code."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

            # Check if SMTP configuration has been provided
            app_password = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
            if not app_password or app_password == 'PASTE_YOUR_GMAIL_APP_PASSWORD_HERE':
                return Response(
                    {
                        "detail": "Email service configuration error: Gmail App Password is not configured. "
                                  "Please paste your Gmail App Password in EMAIL_HOST_PASSWORD in backend/.env.",
                        "code": "smtp_config_missing"
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            # Invalidate any existing unused OTPs for this user
            PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)

            # Generate cryptographically secure 6-digit OTP
            otp_code = f"{secrets.randbelow(900000) + 100000}"
            otp_hash = PasswordResetOTP.hash_otp(otp_code)
            expires_at = timezone.now() + timedelta(minutes=5)

            otp_record = PasswordResetOTP.objects.create(
                user=user,
                otp_hash=otp_hash,
                expires_at=expires_at
            )

            # Subject and Plain-Text Body required by specification
            subject = "University Café System - Password Reset OTP"
            plain_body = (
                "Hello,\n\n"
                "We received a request to reset your University Café System account password.\n\n"
                f"Your One-Time Password (OTP) is:\n{otp_code}\n\n"
                "This code is valid for 5 minutes.\n\n"
                "If you did not request this password reset, please ignore this email.\n\n"
                "Thank you,\n"
                "University Café System Team"
            )

            # Clean, responsive HTML alternative
            html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px 12px;
      color: #1e293b;
    }}
    .container {{
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 32px 24px;
    }}
    .header {{
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }}
    .logo {{
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }}
    .otp-box {{
      background-color: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }}
    .otp-code {{
      font-family: 'Courier New', Courier, monospace;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #0f172a;
    }}
    .footer {{
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">University Café System</div>
    </div>
    <p>Hello,</p>
    <p>We received a request to reset your University Café System account password.</p>
    <p>Your One-Time Password (OTP) is:</p>
    <div class="otp-box">
      <div class="otp-code">{otp_code}</div>
    </div>
    <p>This code is valid for <strong>5 minutes</strong>.</p>
    <p>If you did not request this password reset, please ignore this email.</p>
    <div class="footer">
      <p>Thank you,<br><strong>University Café System Team</strong></p>
    </div>
  </div>
</body>
</html>"""

            from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
            try:
                email_msg = EmailMultiAlternatives(
                    subject=subject,
                    body=plain_body,
                    from_email=from_email,
                    to=[user.email],
                )
                email_msg.attach_alternative(html_body, "text/html")
                email_msg.send(fail_silently=False)
            except smtplib.SMTPAuthenticationError:
                # Do not leave an unusable active OTP after failed email delivery
                otp_record.delete()
                return Response(
                    {
                        "detail": "Gmail SMTP authentication failed. Please verify your Gmail App Password in backend/.env.",
                        "code": "smtp_auth_failed"
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            except (smtplib.SMTPException, OSError):
                # Do not leave an unusable active OTP after failed email delivery
                otp_record.delete()
                return Response(
                    {
                        "detail": "Unable to connect to Gmail SMTP server. Please check your network connection and SMTP settings.",
                        "code": "smtp_connect_failed"
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            except Exception:
                # Catch-all safe error without leaking internal secrets
                otp_record.delete()
                return Response(
                    {
                        "detail": "Failed to deliver OTP email. Please try again later.",
                        "code": "email_delivery_failed"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response({"message": generic_msg}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        student_id = serializer.validated_data.get('student_id', '').strip()
        email = serializer.validated_data.get('email', '').strip().lower()
        plain_otp = serializer.validated_data['otp'].strip()

        if student_id:
            user = User.objects.filter(student_id__iexact=student_id, is_active=True).first()
        elif email:
            user = User.objects.filter(email__iexact=email, is_active=True).first()
        else:
            user = None

        if not user:
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_record = PasswordResetOTP.objects.filter(user=user, is_used=False).order_by('-created_at').first()
        if not otp_record:
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.is_expired:
            otp_record.is_used = True
            otp_record.save(update_fields=['is_used'])
            return Response({"detail": "OTP has expired. Please request a new code."}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.attempts >= 5:
            otp_record.is_used = True
            otp_record.save(update_fields=['is_used'])
            return Response({"detail": "Too many invalid attempts. Please request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.attempts += 1
        otp_record.save(update_fields=['attempts'])

        if not otp_record.check_otp(plain_otp):
            remaining_attempts = 5 - otp_record.attempts
            return Response(
                {"detail": f"Incorrect OTP code. {remaining_attempts} attempts remaining."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate secure short-lived reset token (valid for 10 minutes)
        payload = f"{user.id}:{otp_record.id}"
        reset_token = signer.sign(payload)

        return Response(
            {
                "message": "OTP verified successfully. You may now reset your password.",
                "reset_token": reset_token
            },
            status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        reset_token = serializer.validated_data['reset_token']
        new_password = serializer.validated_data['password']

        try:
            # 10 minute token max age
            payload = signer.unsign(reset_token, max_age=600)
            user_id_str, otp_id_str = payload.split(':')
            user_id = int(user_id_str)
            otp_id = int(otp_id_str)
        except (BadSignature, SignatureExpired, ValueError):
            return Response(
                {"detail": "Invalid or expired reset session. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id, is_active=True)
            otp_record = PasswordResetOTP.objects.get(id=otp_id, user=user)
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            return Response(
                {"detail": "Invalid password reset request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_record.is_used:
            return Response(
                {"detail": "This reset token has already been used."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password using Django Argon2 hasher
        user.set_password(new_password)
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save()

        # Invalidate OTP single-use
        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])

        return Response(
            {"message": "Password updated successfully. You can now log in with your new password."},
            status=status.HTTP_200_OK
        )


# Role-based Placeholder API Views for Phase 1 verification
class CustomerDashboardView(APIView):
    permission_classes = [IsCustomer]

    def get(self, request):
        return Response({
            "message": f"Hello {request.user.full_name}! You are logged in as a Customer. These are the pages available to your account. More features will be introduced in Phase 2.",
            "role": request.user.role,
            "user": UserSerializer(request.user).data
        })


class CafeOwnerDashboardView(APIView):
    permission_classes = [IsCafeOwner]

    def get(self, request):
        return Response({
            "message": f"Hello {request.user.full_name}! You are logged in as a Café Owner. These are the pages available to your account. More features will be introduced in Phase 2.",
            "role": request.user.role,
            "user": UserSerializer(request.user).data
        })


class CafeWorkerDashboardView(APIView):
    permission_classes = [IsCafeWorker]

    def get(self, request):
        return Response({
            "message": f"Hello {request.user.full_name}! You are logged in as a Café Worker. These are the pages available to your account. More features will be introduced in Phase 2.",
            "role": request.user.role,
            "user": UserSerializer(request.user).data
        })


class AdminDashboardView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        return Response({
            "message": f"Hello {request.user.full_name}! You are logged in as an Admin. These are the pages available to your account. More features will be introduced in Phase 2.",
            "role": request.user.role,
            "user": UserSerializer(request.user).data
        })
