from django.conf import settings
from django.utils import timezone
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


def enforce_csrf(request):
    """
    Enforces CSRF validation using Django's built-in CsrfViewMiddleware (via DRF's CSRFCheck).
    Safe methods (GET, HEAD, OPTIONS, TRACE) are accepted without CSRF tokens.
    State-changing methods (POST, PUT, PATCH, DELETE) require a valid CSRF cookie
    and matching X-CSRFToken header.
    """
    def dummy_get_response(request):
        return None

    check = CSRFCheck(dummy_get_response)
    # Populates request.META['CSRF_COOKIE'] from the request cookie
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise exceptions.PermissionDenied(f'CSRF Failed: {reason}')


class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that extracts the access token from
    an HttpOnly cookie first, falling back to the Authorization header.
    Also validates 3-minute inactivity timeout for API requests.
    Enforces CSRF validation for cookie-authenticated state-changing requests.
    """
    def enforce_csrf(self, request):
        enforce_csrf(request)

    def authenticate(self, request):
        # 1. Check HttpOnly cookie
        raw_token = request.COOKIES.get('access_token')
        is_cookie_auth = raw_token is not None

        # 2. Fall back to Authorization header if cookie not found
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        # Enforce CSRF protection for state-changing requests authenticated via cookies
        if is_cookie_auth:
            self.enforce_csrf(request)

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
        except (InvalidToken, AuthenticationFailed):
            return None

        if not user or not user.is_active:
            raise AuthenticationFailed("User account is disabled or inactive.")

        # Check 3-minute inactivity timeout (180 seconds)
        timeout_seconds = getattr(settings, 'INACTIVITY_TIMEOUT_SECONDS', 180)
        now = timezone.now()
        if user.last_activity:
            elapsed = (now - user.last_activity).total_seconds()
            if elapsed > timeout_seconds:
                user.last_activity = None
                user.save(update_fields=['last_activity'])
                raise AuthenticationFailed(
                    "Session expired due to 3 minutes of inactivity. Please log in again.",
                    code='session_expired'
                )

        # Update last activity
        user.last_activity = now
        user.save(update_fields=['last_activity'])

        return user, validated_token
