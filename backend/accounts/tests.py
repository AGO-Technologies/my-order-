from datetime import timedelta
from django.contrib.auth.hashers import identify_hasher
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserRole, Device, PasswordResetOTP


class AuthenticationAndSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.valid_customer_data = {
            'full_name': 'Amir Kebede',
            'student_id': 'RU0101/16',
            'email': 'amir.test@gmail.com',
            'phone_number': '0911223344',
            'fan': '12345678',
            'zone': 1,
            'block': '12',
            'room': '05',
            'password': 'SecureP@ssword123',
            'confirm_password': 'SecureP@ssword123',
        }

    # 1. Customer registration works correctly
    def test_customer_registration_success(self):
        response = self.client.post('/api/auth/register/', self.valid_customer_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='amir.test@gmail.com').exists())
        user = User.objects.get(email='amir.test@gmail.com')
        self.assertEqual(user.role, UserRole.CUSTOMER)
        self.assertEqual(user.allowed_devices, 1)

    # 2. Duplicate Student ID is rejected
    def test_duplicate_student_id_rejected(self):
        self.client.post('/api/auth/register/', self.valid_customer_data)
        data = self.valid_customer_data.copy()
        data['email'] = 'another.student@gmail.com'
        data['phone_number'] = '0922334455'
        data['fan'] = '88889999'
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student_id', response.data)

    # 3. Duplicate email is rejected
    def test_duplicate_email_rejected(self):
        self.client.post('/api/auth/register/', self.valid_customer_data)
        data = self.valid_customer_data.copy()
        data['student_id'] = 'RU0202/16'
        data['phone_number'] = '0922334455'
        data['fan'] = '88889999'
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # 4. Duplicate phone number is rejected
    def test_duplicate_phone_number_rejected(self):
        self.client.post('/api/auth/register/', self.valid_customer_data)
        data = self.valid_customer_data.copy()
        data['student_id'] = 'RU0202/16'
        data['email'] = 'another.student@gmail.com'
        data['fan'] = '88889999'
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    # 5. Duplicate FAN is rejected
    def test_duplicate_fan_rejected(self):
        self.client.post('/api/auth/register/', self.valid_customer_data)
        data = self.valid_customer_data.copy()
        data['student_id'] = 'RU0202/16'
        data['email'] = 'another.student@gmail.com'
        data['phone_number'] = '0922334455'
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('fan', response.data)

    # 6. Invalid Gmail addresses are rejected
    def test_invalid_gmail_rejected(self):
        data = self.valid_customer_data.copy()
        data['email'] = 'user@yahoo.com'
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # 7. Invalid phone numbers are rejected
    def test_invalid_phone_numbers_rejected(self):
        invalid_numbers = ['0811223344', '091122334', '09112233445', '09112233ab']
        for num in invalid_numbers:
            data = self.valid_customer_data.copy()
            data['phone_number'] = num
            response = self.client.post('/api/auth/register/', data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('phone_number', response.data)

    # 8. Invalid Student IDs are rejected (accepts both RU and ru prefix)
    def test_invalid_student_id_rejected(self):
        invalid_ids = ['RU101/16', 'RU010116', 'AA0101/16', 'RU0101/1', '120101/16']
        for sid in invalid_ids:
            data = self.valid_customer_data.copy()
            data['student_id'] = sid
            response = self.client.post('/api/auth/register/', data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('student_id', response.data)

    def test_student_id_case_insensitive_accepted(self):
        # Test lowercase 'ru' prefix
        data = self.valid_customer_data.copy()
        data['student_id'] = 'ru0101/16'
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # 9. Weak passwords are rejected
    def test_weak_passwords_rejected(self):
        weak_passwords = [
            'Short1!',        # < 9 characters
            'alllowercase1!', # No uppercase
            'ALLUPPERCASE1!', # No lowercase
            'NoNumberHere!',  # No digits
            'NoSpecial1234',  # No special char
        ]
        for pwd in weak_passwords:
            data = self.valid_customer_data.copy()
            data['password'] = pwd
            data['confirm_password'] = pwd
            response = self.client.post('/api/auth/register/', data)
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('password', response.data)

    # 10. Passwords are stored using Argon2
    def test_password_stored_with_argon2(self):
        response = self.client.post('/api/auth/register/', self.valid_customer_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='amir.test@gmail.com')
        hasher = identify_hasher(user.password)
        self.assertEqual(hasher.algorithm, 'argon2')

    # 11. Public registration cannot assign privileged roles
    def test_public_registration_cannot_set_role(self):
        data = self.valid_customer_data.copy()
        data['role'] = 'ADMIN'
        data['is_staff'] = True
        data['is_superuser'] = True
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='amir.test@gmail.com')
        self.assertEqual(user.role, UserRole.CUSTOMER)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    # 12. Login works using email and password
    def test_login_success(self):
        self.client.post('/api/auth/register/', self.valid_customer_data)
        login_data = {
            'email': 'amir.test@gmail.com',
            'password': 'SecureP@ssword123',
            'device_id': 'device-uuid-1',
            'device_name': 'Amir Laptop'
        }
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertEqual(response.data['user']['role'], UserRole.CUSTOMER)

    # 13. Each role can access its correct dashboard
    def test_role_dashboards_access(self):
        # Create users for all 4 roles
        customer = User.objects.create_user(
            email='cust@gmail.com', full_name='Cust User', password='Password123!', role=UserRole.CUSTOMER
        )
        cafe_owner = User.objects.create_user(
            email='owner@gmail.com', full_name='Owner User', password='Password123!', role=UserRole.CAFE_OWNER
        )
        cafe_worker = User.objects.create_user(
            email='worker@gmail.com', full_name='Worker User', password='Password123!', role=UserRole.CAFE_WORKER
        )
        admin_user = User.objects.create_user(
            email='admin@gmail.com', full_name='Admin User', password='Password123!', role=UserRole.ADMIN
        )

        for user, endpoint in [
            (customer, '/api/customer/dashboard/'),
            (cafe_owner, '/api/cafe-owner/dashboard/'),
            (cafe_worker, '/api/cafe-worker/dashboard/'),
            (admin_user, '/api/admin/dashboard/'),
        ]:
            token = RefreshToken.for_user(user).access_token
            client = APIClient()
            client.cookies['access_token'] = str(token)
            resp = client.get(endpoint)
            self.assertEqual(resp.status_code, status.HTTP_200_OK)
            self.assertIn(user.full_name, resp.data['message'])

    # 14. Customers cannot access Café Owner pages / endpoints
    def test_customer_cannot_access_cafe_owner_endpoint(self):
        customer = User.objects.create_user(
            email='cust2@gmail.com', full_name='Cust User', password='Password123!', role=UserRole.CUSTOMER
        )
        token = RefreshToken.for_user(customer).access_token
        self.client.cookies['access_token'] = str(token)
        response = self.client.get('/api/cafe-owner/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # 15. Café Owners cannot access Admin pages / endpoints
    def test_cafe_owner_cannot_access_admin_endpoint(self):
        owner = User.objects.create_user(
            email='owner2@gmail.com', full_name='Owner User', password='Password123!', role=UserRole.CAFE_OWNER
        )
        token = RefreshToken.for_user(owner).access_token
        self.client.cookies['access_token'] = str(token)
        response = self.client.get('/api/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # 16. Unauthorized API requests are rejected
    def test_unauthorized_api_requests_rejected(self):
        client = APIClient()
        endpoints = [
            '/api/customer/dashboard/',
            '/api/cafe-owner/dashboard/',
            '/api/cafe-worker/dashboard/',
            '/api/admin/dashboard/',
            '/api/auth/me/',
        ]
        for ep in endpoints:
            resp = client.get(ep)
            self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # 17. Forgot Password OTP works correctly via Student ID lookup
    @override_settings(EMAIL_HOST_PASSWORD='test-app-password')
    def test_forgot_password_otp_flow(self):
        from django.core import mail
        user = User.objects.create_user(
            email='reset.user@gmail.com',
            full_name='Reset User',
            password='OldPassword123!',
            student_id='RU7788/19'
        )
        # Request OTP using Student ID (user does not provide email)
        resp = self.client.post('/api/auth/forgot-password/', {'student_id': 'RU7788/19'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('Student ID', resp.data['message'])

        # Verify email was dispatched to user's registered email
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['reset.user@gmail.com'])
        self.assertEqual(mail.outbox[0].subject, 'University Café System - Password Reset OTP')

        otp_record = PasswordResetOTP.objects.filter(user=user, is_used=False).first()
        self.assertIsNotNone(otp_record)

        # Mock known plain OTP
        otp_record.otp_hash = PasswordResetOTP.hash_otp('123456')
        otp_record.save()

        # Verify OTP using Student ID
        verify_resp = self.client.post('/api/auth/verify-otp/', {
            'student_id': 'RU7788/19',
            'otp': '123456'
        })
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertIn('reset_token', verify_resp.data)

        # Reset Password
        reset_resp = self.client.post('/api/auth/reset-password/', {
            'reset_token': verify_resp.data['reset_token'],
            'password': 'NewSecureP@ss123',
            'confirm_password': 'NewSecureP@ss123'
        })
        self.assertEqual(reset_resp.status_code, status.HTTP_200_OK)

        # Verify user can log in with new password
        user.refresh_from_db()
        self.assertTrue(user.check_password('NewSecureP@ss123'))

    # 18. Expired OTPs are rejected
    def test_expired_otp_rejected(self):
        user = User.objects.create_user(
            email='expired.otp@gmail.com',
            full_name='Expired OTP User',
            password='OldPassword123!',
            student_id='RU9900/19'
        )
        expired_time = timezone.now() - timedelta(minutes=6)
        PasswordResetOTP.objects.create(
            user=user,
            otp_hash=PasswordResetOTP.hash_otp('654321'),
            expires_at=expired_time
        )
        resp = self.client.post('/api/auth/verify-otp/', {
            'student_id': 'RU9900/19',
            'otp': '654321'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expired', resp.data['detail'].lower())

    # 19. Reused OTPs are rejected
    def test_reused_otp_rejected(self):
        user = User.objects.create_user(
            email='reused.otp@gmail.com',
            full_name='Reused OTP User',
            password='OldPassword123!',
            student_id='RU9911/19'
        )
        PasswordResetOTP.objects.create(
            user=user,
            otp_hash=PasswordResetOTP.hash_otp('112233'),
            expires_at=timezone.now() + timedelta(minutes=5),
            is_used=True
        )
        resp = self.client.post('/api/auth/verify-otp/', {
            'student_id': 'RU9911/19',
            'otp': '112233'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # 19b. Placeholder Gmail App Password returns clear configuration error
    @override_settings(EMAIL_HOST_PASSWORD='PASTE_YOUR_GMAIL_APP_PASSWORD_HERE')
    def test_placeholder_smtp_password_returns_configuration_error(self):
        User.objects.create_user(
            email='placeholder.test@gmail.com',
            full_name='Placeholder User',
            password='Password123!',
            student_id='RU5566/19'
        )
        resp = self.client.post('/api/auth/forgot-password/', {'student_id': 'RU5566/19'})
        self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(resp.data.get('code'), 'smtp_config_missing')
        # Ensure no active OTP record was left
        self.assertFalse(PasswordResetOTP.objects.filter(user__student_id='RU5566/19', is_used=False).exists())

    # 20. Brute-force protection works
    def test_brute_force_lockout(self):
        user = User.objects.create_user(
            email='bruteforce@gmail.com', full_name='BF User', password='CorrectPassword123!'
        )
        # 5 failed login attempts
        for i in range(5):
            resp = self.client.post('/api/auth/login/', {
                'email': 'bruteforce@gmail.com',
                'password': 'WrongPassword!',
                'device_id': 'dev-1'
            })
            if i < 4:
                self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
            else:
                self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
                self.assertIn('lockout_seconds', resp.data)

        # 6th attempt even with correct password is blocked during lockout
        blocked_resp = self.client.post('/api/auth/login/', {
            'email': 'bruteforce@gmail.com',
            'password': 'CorrectPassword123!',
            'device_id': 'dev-1'
        })
        self.assertEqual(blocked_resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    # 21. Device limit is enforced
    def test_device_limit_enforced(self):
        user = User.objects.create_user(
            email='devlimit@gmail.com', full_name='Device User', password='CorrectPassword123!'
        )
        user.allowed_devices = 1
        user.save()

        # Login from device 1 (allowed)
        resp1 = self.client.post('/api/auth/login/', {
            'email': 'devlimit@gmail.com',
            'password': 'CorrectPassword123!',
            'device_id': 'device-uuid-1'
        })
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Login from device 2 (rejected due to limit of 1)
        resp2 = self.client.post('/api/auth/login/', {
            'email': 'devlimit@gmail.com',
            'password': 'CorrectPassword123!',
            'device_id': 'device-uuid-2'
        })
        self.assertEqual(resp2.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Device limit reached', resp2.data['detail'])

    # 22. Administrators can change device limits
    def test_admin_changes_device_limit(self):
        user = User.objects.create_user(
            email='devlimit2@gmail.com', full_name='Device User 2', password='CorrectPassword123!'
        )
        user.allowed_devices = 2
        user.save()

        # Login device 1
        resp1 = self.client.post('/api/auth/login/', {
            'email': 'devlimit2@gmail.com',
            'password': 'CorrectPassword123!',
            'device_id': 'device-1'
        })
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        # Login device 2 (now allowed because limit is 2)
        resp2 = self.client.post('/api/auth/login/', {
            'email': 'devlimit2@gmail.com',
            'password': 'CorrectPassword123!',
            'device_id': 'device-2'
        })
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)

    # 23. Inactive sessions expire after 3 minutes
    def test_inactivity_session_timeout(self):
        user = User.objects.create_user(
            email='inactive@gmail.com', full_name='Inactive User', password='Password123!'
        )
        token = RefreshToken.for_user(user).access_token
        client = APIClient()
        client.cookies['access_token'] = str(token)

        # Simulate last activity 4 minutes ago
        user.last_activity = timezone.now() - timedelta(minutes=4)
        user.save()

        response = client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('3 minutes of inactivity', response.data['detail'])

    # 24. Logout invalidates authentication
    def test_logout_clears_cookies(self):
        user = User.objects.create_user(
            email='logout@gmail.com', full_name='Logout User', password='Password123!'
        )
        refresh = RefreshToken.for_user(user)
        self.client.cookies['access_token'] = str(refresh.access_token)
        self.client.cookies['refresh_token'] = str(refresh)

        resp = self.client.post('/api/auth/logout/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Verify access_token and refresh_token are cleared in cookies
        self.assertEqual(resp.cookies['access_token'].value, '')
        self.assertEqual(resp.cookies['refresh_token'].value, '')

    # 25. CSRF endpoint works
    def test_csrf_cookie_endpoint(self):
        resp = self.client.get('/api/auth/csrf/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('csrfToken', resp.data)
