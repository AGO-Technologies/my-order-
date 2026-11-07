# Security Architecture and Policy — University Café Pre-Order System

This document provides a comprehensive, verified technical reference for the security mechanisms implemented in the University Café Pre-Order System (Phase 1). It details how the backend (Django + Django REST Framework) and frontend (React + TypeScript + Tailwind CSS) work together to protect user data, authenticate sessions, enforce access controls, and defend against unauthorized access.

This document reflects the actual verified source code in the project. Any features that are incomplete, partially implemented, or require production configuration are explicitly documented as such.

---

## 1. Security Overview

### General Security Architecture
The University Café Pre-Order System enforces defense-in-depth across multiple independent layers. The backend acts as the single source of truth and authoritative enforcement boundary. The frontend provides immediate user feedback and route guard redirection, but the system never relies on frontend controls alone for security.

```
+-------------------------------------------------------------------------+
|                              CLIENT LAYER                               |
|  - React 19 + TypeScript Route Guards (ProtectedRoute.tsx)              |
|  - Input format verification (Regex, Password complexity checklist)     |
|  - Inactivity watchdog timer (180 seconds user interaction tracking)   |
|  - Zero storage of JWT tokens in localStorage / sessionStorage           |
+-------------------------------------------------------------------------+
                                    |
                    HTTPS / HTTP with SameSite Cookies
                    & X-CSRFToken Headers
                                    v
+-------------------------------------------------------------------------+
|                        DJANGO MIDDLEWARE LAYER                          |
|  - CorsMiddleware: Origin restriction to whitelisted addresses          |
|  - CsrfViewMiddleware: Enforces valid CSRF token on POST/PUT/DELETE     |
|  - InactivityTimeoutMiddleware: Enforces 180s idle expiration           |
|  - SecurityMiddleware: Defends against content sniffing & clickjacking   |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     AUTHENTICATION & DISPATCH LAYER                     |
|  - JWTCookieAuthentication: Extracts JWT from HttpOnly cookie           |
|  - SimpleJWT Token Verification (HMAC-SHA256 signature check)           |
|  - Token Blacklist: Prevents reuse of invalidated refresh tokens        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       AUTHORIZATION & RBAC LAYER                        |
|  - Permission Classes: IsCustomer, IsCafeOwner, IsCafeWorker,           |
|    IsSystemAdmin                                                        |
|  - Rejects role mismatch with HTTP 403 Forbidden                        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    VALIDATION & STORAGE LAYER (ORM)                     |
|  - Serializers: Strict data sanitization & regex validators             |
|  - Personal info similarity checks against password                     |
|  - Argon2id Password Hasher (memory-hard, GPU-resistant)                |
|  - Device Limit Check (HTTP 403 when active devices > allowed_devices)  |
|  - Brute-force Lockout (5 attempts -> 5-minute lockout)                 |
|  - SHA-256 OTP hashing & 5-minute expiration window                     |
+-------------------------------------------------------------------------+
```

### Authentication vs. Authorization
- **Authentication (Who are you?):** Verifying the identity of a user through email and password, validating their session via cryptographically signed JWT cookies, and confirming their device registration.
- **Authorization (What are you allowed to do?):** Enforcing the specific actions and data a verified user can access based on their assigned role (`CUSTOMER`, `CAFE_OWNER`, `CAFE_WORKER`, or `ADMIN`).

---

## 2. Authentication Security

### Email and Password Authentication
- Users log in using their registered email address and password via `POST /api/auth/login/`.
- The backend normalizes emails to lowercase to prevent casing mismatch issues.
- Verification uses Django's `check_password()` method, executing against the stored Argon2 hash.
- **Implementation File:** `backend/accounts/views.py` (`LoginView`).

### Custom Django User Model
- The system replaces Django's default user model with a custom `User` model inheriting from `AbstractBaseUser` and `PermissionsMixin`.
- Uses `email` as the unique `USERNAME_FIELD` instead of a username.
- Tracks security attributes directly on the user record: `failed_login_attempts`, `lockout_until`, `last_activity`, and `allowed_devices`.
- **Implementation File:** `backend/accounts/models.py` (`User`).

### JSON Web Token (JWT) Architecture
- Tokens are issued upon successful authentication using `rest_framework_simplejwt`.
- **Access Token:** Short-lived (15 minutes). Used to authenticate API requests.
- **Refresh Token:** Longer-lived (24 hours). Used to obtain a new access token via `POST /api/auth/refresh/`.
- Token rotation is enabled: each time a refresh token is used, it is invalidated and replaced with a new one.
- **Implementation File:** `backend/config/settings.py` (`SIMPLE_JWT` configuration).

### HttpOnly Authentication Cookies
- JWT tokens are **never returned in the response JSON body** during login.
- Instead, the backend sets them inside `HttpOnly` cookies via the helper `set_auth_cookies()`:
  - `access_token`: Max age 15 minutes (900 seconds), `HttpOnly=True`, `SameSite='Lax'`, `Path='/'`.
  - `refresh_token`: Max age 24 hours (86,400 seconds), `HttpOnly=True`, `SameSite='Lax'`, `Path='/'`.
- Because `HttpOnly` is enabled, client-side JavaScript cannot read or extract the tokens via `document.cookie`. This provides strong protection against token theft via Cross-Site Scripting (XSS).
- Cookie `secure` flag is dynamically configured: `secure = not settings.DEBUG` (automatically True in production when `DEBUG=False`).
- **Implementation File:** `backend/accounts/views.py` (`set_auth_cookies`).

### Custom Cookie Authentication Class
- Django REST Framework is configured with `JWTCookieAuthentication` as its default authentication class.
- It extracts the access token from the `access_token` cookie first, falling back to the standard `Authorization: Bearer <token>` header if present.
- It verifies that the user is active (`is_active = True`) and enforces the 3-minute inactivity check before permitting view execution.
- **Implementation File:** `backend/accounts/authentication.py` (`JWTCookieAuthentication`).

### CSRF Protection
- Cross-Site Request Forgery is mitigated using Django's built-in `CsrfViewMiddleware`.
- `CSRF_COOKIE_HTTPONLY` is set to `False` so the frontend can read the `csrftoken` cookie or fetch it from `GET /api/auth/csrf/`.
- For all state-changing HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`), the frontend API client (`frontend/src/services/api.ts`) automatically attaches the `X-CSRFToken` header.
- **Implementation Files:** `backend/config/settings.py`, `frontend/src/services/api.ts`, `backend/accounts/views.py` (`CSRFTokenView`).

### Logout and Token Blacklisting
- Logging out via `POST /api/auth/logout/` performs a full server-side invalidation:
  1. Sets `user.last_activity = None`.
  2. Extracts the `refresh_token` from the request cookie and adds it to the database blacklist table (`OutstandingToken` / `BlacklistedToken`) via SimpleJWT's blacklisting module.
  3. Explicitly deletes both `access_token` and `refresh_token` cookies on the outgoing HTTP response (`delete_cookie`).
- **Implementation File:** `backend/accounts/views.py` (`LogoutView`).

---

## 3. Password Security

### Argon2 Password Hashing
- Passwords are encrypted using **Argon2id**, the winner of the Password Hashing Competition (PHC).
- Argon2 is a memory-hard algorithm specifically designed to resist brute-force attacks using GPUs, ASICs, and custom cracking hardware.
- The backend configures `django.contrib.auth.hashers.Argon2PasswordHasher` as the primary hasher at index 0 in `PASSWORD_HASHERS`.
- Plaintext passwords are never stored in the database or written to log files.
- **Implementation File:** `backend/config/settings.py` (`PASSWORD_HASHERS`).

### Password Complexity Requirements
During registration and password reset, passwords must satisfy all of the following rules:
- Minimum length of 9 characters.
- At least one uppercase letter (`A-Z`).
- At least one lowercase letter (`a-z`).
- At least one numeric digit (`0-9`).
- At least one special symbol (`[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\'`/]`).
- Evaluated on the backend by `ComplexPasswordValidator` and on the frontend in real time by `PasswordRequirements.tsx`.
- **Implementation Files:** `backend/accounts/validators.py` (`ComplexPasswordValidator`), `frontend/src/components/PasswordRequirements.tsx`.

### Password Confirmation Matching
- Both registration and password reset forms require a `confirm_password` field.
- The serializer verifies that `password == confirm_password`. If they do not match, validation fails with HTTP 400.
- **Implementation File:** `backend/accounts/serializers.py` (`CustomerRegistrationSerializer`, `ResetPasswordSerializer`).

### Personal Information Similarity Defense
To prevent predictable passwords, the registration serializer inspects the chosen password against the user's personal profile attributes. The password is automatically rejected if it contains:
- The user's Student ID (case-insensitive check).
- The user's Phone Number.
- The user's Food Access Number (FAN).
- The user's Email username prefix (if 3 or more characters).
- Additionally, Django's standard `UserAttributeSimilarityValidator` is registered in `AUTH_PASSWORD_VALIDATORS`.
- **Implementation Files:** `backend/accounts/serializers.py` (lines 127-139), `backend/config/settings.py` (`AUTH_PASSWORD_VALIDATORS`).

---

## 4. Forgot Password and OTP Security

The password recovery system is built around a secure, rate-limited One-Time Password (OTP) workflow.

```
[User enters Student ID]
         |
         v
[Validate format: ^[Rr][Uu]\d{4}/\d{2}$]
         |
         v
[Lookup User by Student ID] ---> If Not Found: Return generic success (no enumeration)
         |
         +--> If Found: Check 60-second request rate limit
         |
         +--> Invalidate all previous unused OTPs for user
         |
         +--> Generate 6-digit cryptographic OTP (secrets module)
         |
         +--> Compute SHA-256 hash of OTP
         |
         +--> Save PasswordResetOTP (expires_at = now + 5 minutes)
         |
         +--> Dispatch email via Gmail SMTP (plain text + HTML)
         |
         v
[User submits 6-digit OTP]
         |
         v
[Lookup active OTP record] ---> Check: is_used == False, attempts < 5, now < expires_at
         |
         +--> Increment attempts counter
         |
         +--> Compare SHA-256 hash (constant time comparison)
         |
         +--> If valid: Generate signed reset_token (TimestampSigner, valid 10 min)
         |
         v
[User submits reset_token + new password]
         |
         v
[Validate reset_token signature and expiration (max_age=600s)]
         |
         +--> Validate new password complexity & confirmation
         |
         +--> Update user password with Argon2
         |
         +--> Reset lockout counters (failed_login_attempts = 0)
         |
         +--> Mark OTP is_used = True (single-use enforced)
```

### Verified Workflow Steps

1. **Student ID Input:** The user submits their university Student ID (e.g., `RU1122/19`). The client does not accept an email input.
2. **Student ID Validation:** The serializer validates the input against `^[Rr][Uu]\d{4}/\d{2}$`.
3. **Internal Email Lookup:** The backend retrieves the registered email linked to that Student ID in the database.
4. **Anti-Enumeration Protection:** If the Student ID is not found, the API returns the exact same generic confirmation message as a successful lookup:
   > "If an account matches the provided Student ID, an OTP has been sent to its registered email address. The OTP is valid for 5 minutes."
   The registered email address is never returned in the API response.
5. **Rate Limiting:** Users must wait at least 60 seconds between OTP requests. Repeated requests within 60 seconds return HTTP 429 Too Many Requests.
6. **Previous OTP Invalidation:** Any existing unused OTPs for the user are immediately marked `is_used = True` before creating a new one.
7. **Cryptographic Generation:** The 6-digit code is generated using Python's `secrets.randbelow(900000) + 100000`, which uses operating system entropy (`/dev/urandom` / Windows CryptGenRandom) rather than predictable pseudo-random generators.
8. **Hash-Only Database Storage:** The plaintext OTP is never written to disk. The database stores only a SHA-256 hash (`PasswordResetOTP.otp_hash`).
9. **5-Minute Expiration:** The OTP record is assigned `expires_at = timezone.now() + timedelta(minutes=5)`. Requests submitted after 5 minutes are rejected.
10. **Delivery via Gmail SMTP:** The email is sent through Gmail SMTP using TLS on port 587. If SMTP credentials fail or are unconfigured, the active OTP record is immediately deleted from the database so unusable codes do not persist.
11. **Max Attempt Throttling:** The OTP record tracks `attempts`. After 5 incorrect code submissions, the OTP is marked `is_used = True` and locked.
12. **Cryptographic Reset Token:** Upon successful OTP verification, `VerifyOTPView` generates a signed token using Django's `TimestampSigner(salt='password-reset-salt')` encoding `user.id:otp_record.id`.
13. **Reset Token Verification:** `ResetPasswordView` verifies the token signature and enforces a strict 10-minute maximum age (`max_age=600`).
14. **Single-Use Invalidation:** After updating the password, the OTP record is marked `is_used = True`. Attempting to reuse the same reset token returns an error.
- **Implementation Files:** `backend/accounts/models.py` (`PasswordResetOTP`), `backend/accounts/views.py` (`ForgotPasswordView`, `VerifyOTPView`, `ResetPasswordView`), `frontend/src/pages/auth/ForgotPasswordPage.tsx`.

---

## 5. Brute-Force Protection

To protect accounts against automated credential-stuffing and dictionary attacks:

- **Attempt Limit:** A maximum of 5 consecutive failed login attempts is permitted (`MAX_FAILED_LOGIN_ATTEMPTS = 5`).
- **Tracking:** Each incorrect password submission increments `user.failed_login_attempts` and updates `user.last_failed_login`.
- **Lockout Duration:** When 5 failed attempts occur, the account is locked for 5 minutes (`LOGIN_LOCKOUT_MINUTES = 5`) by setting `user.lockout_until = timezone.now() + timedelta(minutes=5)`.
- **Rejection Status:** Locked accounts attempting to log in receive HTTP 429 Too Many Requests with response code `account_locked` and the exact remaining lockout time in seconds (`remaining_lockout_seconds()`).
- **Counter Reset:** A successful login resets `failed_login_attempts = 0` and clears `lockout_until = None`.
- **Account Enumeration Defense:** For accounts that exist but fail password checks, the system returns generic `{"detail": "Invalid email or password."}` (HTTP 401).
- **Implementation Files:** `backend/accounts/models.py` (`User.is_locked_out`), `backend/accounts/views.py` (`LoginView`, lines 108-148), `backend/config/settings.py` (lines 140-141).

---

## 6. Device Security

The system tracks client hardware and restricts account sharing across unauthorized devices.

### Device Registration and Identification
- Each client browser generates a persistent UUID using `crypto.randomUUID()` stored in browser `localStorage` as `cafe_device_id`.
- The device identifier (`device_id`) and browser name (`device_name`) are transmitted during login.
- The backend captures the client IP address from `HTTP_X_FORWARDED_FOR` or `REMOTE_ADDR`.
- **Implementation Files:** `frontend/src/services/api.ts` (`getOrCreateDeviceId`), `backend/accounts/models.py` (`Device`), `backend/accounts/views.py` (`LoginView`).

### Device Limits
- Each user account has an `allowed_devices` quota on their `User` record.
- **Default Limit:** Public registration sets `allowed_devices = 1`.
- When logging in from a new device, the backend counts existing active devices: `Device.objects.filter(user=user, is_active=True).count()`.
- If the count meets or exceeds `allowed_devices`, login is blocked with **HTTP 403 Forbidden** (`device_limit_reached`).
- **Implementation Files:** `backend/accounts/serializers.py` (line 164), `backend/accounts/views.py` (lines 162-204).

### Device Revocation and Management
- Administrators manage devices directly via the Django Admin portal (`/admin/accounts/device/`).
- Admins can inspect the registered IP address, creation date, and last used timestamp for each device.
- The admin interface provides bulk actions to revoke (`deactivate_devices`) or re-authorize (`activate_devices`) devices.
- If an admin revokes a device (`is_active = False`), that device cannot log in until an administrator re-activates it or device limits permit.
- **Implementation File:** `backend/accounts/admin.py` (`DeviceAdmin`).

---

## 7. Session and Inactivity Security

### Three-Minute Inactivity Window
The system enforces a strict 3-minute (180 seconds) inactivity timeout on both the backend and frontend.

### Backend Enforcement
- Configured in `backend/config/settings.py` via `INACTIVITY_TIMEOUT_SECONDS = 180`.
- **Authentication Check:** `JWTCookieAuthentication` runs on every API request. It compares `timezone.now() - user.last_activity`. If more than 180 seconds have elapsed, it clears `user.last_activity` and raises `AuthenticationFailed` with code `session_expired`.
- **Middleware Check:** `InactivityTimeoutMiddleware` inspects non-exempt paths. If inactive, it clears auth cookies and returns HTTP 401 JSON.
- **Activity Update:** Each valid authenticated request updates `user.last_activity = timezone.now()`.
- **Implementation Files:** `backend/accounts/authentication.py`, `backend/accounts/middleware.py`, `backend/config/settings.py`.

### Frontend Enforcement
- `frontend/src/context/AuthContext.tsx` maintains an inactivity countdown timer set to `INACTIVITY_TIMEOUT_MS = 180,000` (3 minutes).
- Activity listeners monitor five user events: `mousemove`, `keydown`, `mousedown`, `touchstart`, and `scroll`.
- Every detected event resets the inactivity timer.
- If no event is detected for 3 minutes, the frontend triggers `logout(true)`, removes session state, and redirects to `/login` displaying a clear session-expired alert.
- **Implementation File:** `frontend/src/context/AuthContext.tsx` (lines 64-106).

---

## 8. Role-Based Access Control (RBAC)

The system supports four distinct user roles defined in `backend/accounts/models.py`:

| Role Identifier | Human-Readable Name | Primary Purpose |
| :--- | :--- | :--- |
| `CUSTOMER` | Customer | University students placing pre-orders |
| `CAFE_OWNER` | Café Owner | Managing café profile, menu items, and operating hours |
| `CAFE_WORKER` | Café Worker | Viewing and fulfilling the live kitchen order queue |
| `ADMIN` | Admin | System administration, user roles, device quota overrides |

### Public Registration Restriction
- Public registration (`POST /api/auth/register/`) is strictly restricted to `CUSTOMER` accounts.
- In `CustomerRegistrationSerializer.create()`, the backend overrides any user-supplied role and explicitly forces:
  ```python
  validated_data['role'] = UserRole.CUSTOMER
  validated_data['allowed_devices'] = 1
  ```
- Public users cannot promote themselves to Café Owner, Worker, or Admin through registration payloads or query parameters.
- Changing user roles is only possible through the Django Admin interface by an authorized superuser.
- **Implementation File:** `backend/accounts/serializers.py` (lines 160-169).

### Backend Permission Classes
API endpoints are guarded by custom DRF permission classes in `backend/accounts/permissions.py`:
- `IsCustomer`: Rejects any request where `user.role != 'CUSTOMER'`.
- `IsCafeOwner`: Rejects any request where `user.role != 'CAFE_OWNER'`.
- `IsCafeWorker`: Rejects any request where `user.role != 'CAFE_WORKER'`.
- `IsSystemAdmin`: Rejects any request where `user.role != 'ADMIN'`.
- Unauthorized requests receive **HTTP 403 Forbidden**.
- **Implementation File:** `backend/accounts/permissions.py`.

### Frontend Route Guards
- Frontend routes are wrapped in `<ProtectedRoute allowedRoles={['...']}>`.
- If an unauthenticated user accesses a protected path, they are redirected to `/login`.
- If an authenticated user attempts to access a path assigned to another role, `ProtectedRoute` intercepts the request and redirects them to their own authorized dashboard (`getDashboardPath(user.role)`).
- **Implementation Files:** `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/App.tsx`.

---

## 9. API Security

### REST Framework Default Settings
- `DEFAULT_PERMISSION_CLASSES`: Set to `('rest_framework.permissions.IsAuthenticated',)` in `settings.py`. Endpoints require authentication unless explicitly decorated with `permission_classes = [AllowAny]`.
- `DEFAULT_AUTHENTICATION_CLASSES`: Set to `('accounts.authentication.JWTCookieAuthentication',)`.
- **Implementation File:** `backend/config/settings.py` (lines 116-123).

### Cross-Origin Resource Sharing (CORS)
- Handled by `django-cors-headers`.
- `CORS_ALLOWED_ORIGINS` explicitly whitelists known local development origins:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
- `CORS_ALLOW_CREDENTIALS = True` permits transmitting `HttpOnly` cookies across origins.
- **Implementation File:** `backend/config/settings.py` (lines 144-150).

### Security Headers and Clickjacking
- Django's `XFrameOptionsMiddleware` is active in `MIDDLEWARE`, preventing the application from being embedded in frames/iframes (Clickjacking defense).
- `SecurityMiddleware` is active in `MIDDLEWARE`, handling standard HTTP security headers.
- **Implementation File:** `backend/config/settings.py` (lines 41-51).

---

## 10. Input Validation and Data Protection

All incoming user data is validated on the backend before touching database models.

| Data Field | Validation Rule | Backend Implementation |
| :--- | :--- | :--- |
| **Student ID** | Must match `^[Rr][Uu]\d{4}/\d{2}$` (case-insensitive RU prefix, 4 digits, slash, 2 digits). Must be unique. | `backend/accounts/validators.py` (`validate_student_id`) |
| **Email Address** | Must be lowercase and end with `@gmail.com`. Must be unique. | `backend/accounts/validators.py` (`validate_gmail`) |
| **Phone Number** | Exactly 10 digits starting with `09` or `07` (`^(09|07)\d{8}$`). Must be unique. | `backend/accounts/validators.py` (`validate_phone_number`) |
| **Food Access No. (FAN)** | Numeric characters only (`^\d+$`). Must be unique. | `backend/accounts/validators.py` (`validate_fan`) |
| **Dormitory Zone** | Must be an integer chosen from `[1, 2, 3, 4]`. | `backend/accounts/serializers.py` (`validate_zone`) |
| **Block & Room** | 1 to 2 numeric digits (`^\d{1,2}$`). | `backend/accounts/validators.py` (`validate_block_or_room`) |
| **Password Complexity** | At least 9 characters, >=1 uppercase, >=1 lowercase, >=1 number, >=1 special character. | `backend/accounts/validators.py` (`ComplexPasswordValidator`) |
| **Password Similarity** | Rejects passwords containing Student ID, Phone, FAN, or Email username prefix. | `backend/accounts/serializers.py` (`CustomerRegistrationSerializer.validate`) |

---

## 11. Frontend Security

### Route Protection and Guard Architecture
The React application structures all protected views inside `<ProtectedRoute>`:
- Checks `AuthContext` state on mount.
- While checking session with `/api/auth/me/`, renders a neutral loading state.
- Unauthenticated users are redirected to `/login`.
- Authenticated users attempting to visit foreign dashboards are routed to their own home path.
- **Implementation File:** `frontend/src/components/ProtectedRoute.tsx`.

### Token Isolation
- JWT tokens are stored exclusively in backend-managed `HttpOnly` cookies.
- No access tokens, refresh tokens, or user passwords are ever stored in `localStorage` or `sessionStorage`.
- `localStorage` stores only the non-sensitive client device identifier (`cafe_device_id`).
- `sessionStorage` stores only the dismiss state of the Phase 1 completion popup (`phase1_completion_dismissed`).

### Error Sanitization
- Login error alerts display generic feedback (`Invalid email or password`) to prevent account enumeration.
- Server-side exceptions during OTP email sending return generic system error messages without exposing SMTP server stack traces or connection credentials.

---

## 12. Environment Variables and Secret Management

All sensitive secrets are isolated inside `backend/.env`, which is explicitly excluded from version control in `.gitignore`.

### Managed Environment Variables
```env
# Server Mode
DEBUG=True

# Cryptographic signing key for Django and JWT
SECRET_KEY=django-insecure-university-cafe-secret-key-phase1-dev-2026

# Host Whitelist
ALLOWED_HOSTS=localhost,127.0.0.1

# Gmail SMTP Email Delivery
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=amukaseid18@gmail.com
EMAIL_HOST_PASSWORD=PASTE_YOUR_GMAIL_APP_PASSWORD_HERE
DEFAULT_FROM_EMAIL=amukaseid18@gmail.com
```

### Protection Rules
- The template file `backend/.env.example` contains placeholder values and is committed to git.
- The actual file `backend/.env` is excluded in root `.gitignore` (`.env`, `*.env`).
- Secrets must never be committed to repository history or hardcoded into Python or TypeScript source files.
- The Gmail App Password is a 16-character application-specific token, avoiding the need to store main Google account passwords.

---

## 13. Security File Reference

| File Path | Security Responsibility | When to Inspect or Modify |
| :--- | :--- | :--- |
| `backend/config/settings.py` | Central security settings, password hashers, CORS, SimpleJWT configuration, session timeouts, and SMTP parameters. | When changing timeouts, JWT lifespans, allowed hosts, or CORS origins. |
| `backend/accounts/models.py` | Defines `User`, `Device`, and `PasswordResetOTP` tables; implements lockout logic, device associations, and OTP hashing. | When altering database fields, lockout calculations, or OTP schema. |
| `backend/accounts/authentication.py` | Implements `JWTCookieAuthentication` to extract and verify tokens from `HttpOnly` cookies and validate 180s inactivity. | When adjusting token extraction or backend inactivity checks. |
| `backend/accounts/middleware.py` | Implements `InactivityTimeoutMiddleware` to clear sessions globally on idle requests. | When adding exempt paths or modifying global timeout behavior. |
| `backend/accounts/permissions.py` | Contains DRF role permission classes (`IsCustomer`, `IsCafeOwner`, `IsCafeWorker`, `IsSystemAdmin`). | When adding new roles or restricting API endpoints. |
| `backend/accounts/serializers.py` | Enforces server-side validation, password similarity checks, and forces `role = CUSTOMER` on public registration. | When modifying input formats or registration constraints. |
| `backend/accounts/validators.py` | Defines regex validators for Student ID, phone, FAN, Gmail, and the `ComplexPasswordValidator` class. | When changing password complexity rules or field formats. |
| `backend/accounts/views.py` | Handles login brute-force tracking, device limits, OTP generation, SMTP dispatch, token issuance, and logout cookie clearing. | When troubleshooting authentication failures or email sending. |
| `backend/accounts/admin.py` | Configures Django Admin controls for managing user roles, device activation/revocation, and unlocking locked accounts. | When adding admin actions or modifying admin permissions. |
| `backend/.env` | Stores uncommitted secrets: `SECRET_KEY`, `EMAIL_HOST_PASSWORD`, `DEBUG`. | When configuring local development credentials or production keys. |
| `frontend/src/context/AuthContext.tsx` | Tracks client authentication state, manages the 180s idle timer, and listens for user activity events. | When adjusting frontend idle timeouts or session check logic. |
| `frontend/src/services/api.ts` | Dispatches API calls, injects CSRF tokens, passes `credentials: 'include'`, and manages persistent device UUIDs. | When adjusting API header injection or token refresh handling. |
| `frontend/src/components/ProtectedRoute.tsx` | Guard component intercepting unauthorized role navigation and redirecting users to their permitted dashboard. | When modifying route authorization checks. |
| `frontend/src/components/PasswordRequirements.tsx` | Client-side visual password strength checklist. | When updating client-side password guidance. |

---

## 14. Current Security Limitations and Status

To maintain strict technical accuracy, the system's security features are categorized by their actual implementation status:

### Implemented
- Argon2id password hashing.
- Password complexity validator (>=9 chars, uppercase, lowercase, digit, special symbol).
- Password confirmation checks.
- Personal information similarity password checks (Student ID, phone, FAN, email username).
- JWT authentication via `HttpOnly`, `SameSite='Lax'` cookies.
- Refresh token blacklisting on logout and token rotation.
- Three-minute (180s) inactivity session expiration on both backend and frontend.
- Brute-force account lockout (5 failed attempts -> 5-minute lockout).
- Device limit enforcement per account with persistent browser UUID tracking.
- Django Admin interface for device revocation and role management.
- Student ID lookup for forgot password (never exposes registered email address in response).
- Cryptographic 6-digit OTP generation (`secrets` module), SHA-256 database storage, 5-minute expiration, max 5 attempts.
- 60-second rate-limiting cooldown between OTP requests.
- Single-use cryptographic reset token (`TimestampSigner`) valid for 10 minutes.
- Public registration strictly locked to `CUSTOMER` role in backend serializer.
- DRF role permission classes (`IsCustomer`, `IsCafeOwner`, `IsCafeWorker`, `IsSystemAdmin`).
- CSRF protection with `X-CSRFToken` verification on state-changing requests.
- CORS restricted to whitelisted local development origins.

### Partially Implemented
- **API Throttling:** The Forgot Password endpoint enforces a custom 60-second cooldown per user. However, generic DRF request rate limiting (`AnonRateThrottle`, `UserRateThrottle`) is not yet applied globally across general endpoints.
- **Registration Account Enumeration:** During registration, unique field conflicts return explicit error messages (e.g., `"A user with this Student ID already exists"`). While user-friendly, this allows an attacker to verify whether a particular Student ID or email is registered.
- **Secure Cookie Flag:** Configured in `accounts/views.py` as `secure = not settings.DEBUG`. In development (`DEBUG=True`), cookies are transmitted over standard HTTP. It requires `DEBUG=False` and HTTPS in production to enforce `Secure=True`.

### Not Implemented
- **Multi-Factor Authentication (MFA / 2FA) for Standard Login:** OTP verification is implemented exclusively for password resets. Standard logins do not currently require a secondary verification factor.
- **Persistent Security Audit Logging:** Security events (failed logins, lockouts, device additions, admin role modifications) are logged to the database state and terminal output, but there is no dedicated external SIEM integration or immutable audit log table.
- **Automated Dependency Vulnerability Scanning:** No GitHub Actions or automated CI/CD security audit pipeline (e.g., `pip-audit`, `npm audit`) is currently committed to the repository.

### Requires Production Configuration
- Set `DEBUG = False` in `backend/.env`.
- Replace the development `SECRET_KEY` with a cryptographically secure production key.
- Configure HTTPS with a valid SSL/TLS certificate.
- Enable Django production security flags in `settings.py`:
  - `SECURE_SSL_REDIRECT = True`
  - `SESSION_COOKIE_SECURE = True`
  - `CSRF_COOKIE_SECURE = True`
  - `SECURE_HSTS_SECONDS = 31536000`
- Restrict `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to the exact production domain.
- Migrate from SQLite (`db.sqlite3`) to a managed production database (e.g., PostgreSQL) with network firewall isolation.

---

## 15. Security Maintenance Guide

### How to Change Password Complexity Rules
1. Open `backend/accounts/validators.py`.
2. Modify the regex patterns or minimum length in `ComplexPasswordValidator.validate()`.
3. Update `ComplexPasswordValidator.get_help_text()`.
4. Update matching frontend rules in `frontend/src/components/PasswordRequirements.tsx`.
5. Run the test suite: `python manage.py test accounts` and `npm test`.

### How to Change the Inactivity Timeout Duration
1. Open `backend/config/settings.py` and modify `INACTIVITY_TIMEOUT_SECONDS = 180` (e.g., set to `300` for 5 minutes).
2. Open `frontend/src/context/AuthContext.tsx` and update `INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000` to match.
3. Test that sessions remain active with mouse/keyboard events and terminate when idle.

### How to Modify Device Quotas
1. Open `backend/accounts/serializers.py` (line 164) to change the default quota assigned during registration.
2. To modify an individual user's quota, open Django Admin (`/admin/accounts/user/`), edit the user, and change `allowed_devices`.
3. Device enforcement logic is located in `backend/accounts/views.py` (`LoginView`, lines 162-204).

### How to Modify OTP Parameters
1. **Change Expiration Duration:** Open `backend/accounts/views.py` (`ForgotPasswordView`, line 354) and modify `timedelta(minutes=5)`. Update `PasswordResetOTP.is_expired` in `models.py`.
2. **Change Rate-Limit Cooldown:** Open `backend/accounts/views.py` (line 330) and modify the `60` second cooldown check.
3. **Change Verification Attempts:** Open `backend/accounts/views.py` (`VerifyOTPView`, line 526) to adjust the maximum attempt threshold.

### How to Restrict an Endpoint to a Specific Role
1. Import the desired permission class in your view file from `accounts.permissions`:
   ```python
   from accounts.permissions import IsCafeOwner
   ```
2. Add the permission class to your DRF APIView:
   ```python
   class MyProtectedView(APIView):
       permission_classes = [IsCafeOwner]
   ```

---

## 16. Security Best Practices for Future Development

Future developers working on Phase 2 and beyond must adhere to the following security rules:

1. **Never Trust Frontend Validation Alone:** Frontend validation is for user convenience only. Every field, parameter, and file must be strictly re-validated on the backend.
2. **Never Bypass Authorization Checks:** Always apply role permission classes (`IsCustomer`, `IsCafeOwner`, etc.) to backend API endpoints. Do not rely on hidden frontend buttons or navigation menus.
3. **Never Store Secrets in Source Code:** All API keys, passwords, private keys, and webhook secrets must be read from environment variables via `os.getenv()`.
4. **Never Store Plaintext Sensitive Data:** Passwords must always be hashed with Argon2 via `user.set_password()`. OTP codes must always be hashed with SHA-256 before database insertion.
5. **Preserve HttpOnly Cookie Storage:** Do not store JWT tokens in `localStorage` or `sessionStorage`. Keep token handling inside secure, `HttpOnly`, `SameSite` cookies.
6. **Do Not Weaken Registration Constraints:** Ensure public registration remains permanently restricted to the `CUSTOMER` role. Role promotion must always require superuser authorization.
7. **Run Security Tests After Changes:** Always execute `python manage.py test accounts` and `npm test` after modifying any authentication, permission, or serializer logic.
