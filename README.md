# University Café Pre-Order System — Phase 1

## Secure Role-Based Authentication System

This repository contains the complete implementation of **Phase 1** for the University Café Pre-Order System. Phase 1 focuses exclusively on security, role-based authentication and authorization, device registration, and session governance. All future modules remain clean, isolated architectural scaffolds.

---

## 1. Technology Stack

### Backend
- **Python 3.12+**
- **Django 6.0+**
- **Django REST Framework (DRF)**
- **djangorestframework-simplejwt** (with token blacklist support)
- **argon2-cffi** (Argon2 password hashing)
- **django-cors-headers**
- **Database:** SQLite (default, clean and isolated for Phase 1)

### Frontend
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **React Router v7**
- **Lucide React** (icons only — strictly zero external image assets)
- **Vite**

---

## 2. Six Django Applications Structure

In accordance with system specifications, six distinct applications are registered in `config/settings.py`:

1. `accounts` — Authentication, custom user model, 4 user roles, Argon2 password management, device registration, 3-minute inactivity middleware, brute-force protection, and 5-minute email OTP password recovery.
2. `cafes` — Clean scaffold for future café registration and stall management.
3. `students` — Clean scaffold for future student meal card and cafeteria profile extensions.
4. `system_admin` — Clean scaffold for custom system administration (named `system_admin` to prevent collisions with Django's built-in `admin`).
5. `orders` — Clean scaffold for future ordering workflows.
6. `transactions` — Clean scaffold for future payment and transaction processing.

---

## 3. Security Architecture & Key Features

### 3.1 Argon2 Password Hashing
- Configured as Django's primary password hasher in `PASSWORD_HASHERS`.
- Passwords are validated using Django's password validator framework plus a custom complexity validator (minimum 9 characters, uppercase, lowercase, number, special character, and personal info dissimilarity check).
- Passwords are encrypted exactly once by Django using Argon2.

### 3.2 User Roles & Public Registration Rules
Four distinct roles are supported:
1. `CUSTOMER`
2. `CAFE_OWNER`
3. `CAFE_WORKER`
4. `ADMIN`

- **Public Registration:** Accessible only to customers (`/register`). The backend strictly forces `role = UserRole.CUSTOMER` and ignores any client-supplied role parameters or headers.
- **Role Elevation:** Privileged roles (`CAFE_OWNER`, `CAFE_WORKER`, `ADMIN`) can only be assigned by authorized administrators through Django Admin.
- Superuser/staff permissions are kept completely separate from the application's frontend `ADMIN` role.

### 3.3 JWT and Cookie Security
- Access tokens (15-min lifetime) and refresh tokens (24-hour lifetime) are stored in secure **HttpOnly** cookies.
- Access and refresh tokens are **never** stored in browser `localStorage` or `sessionStorage`.
- Refresh token rotation and blacklisting are enforced.
- CSRF protection is configured via Django CSRF tokens for all state-changing endpoints.

### 3.4 Device Registration and Limits
- Each browser session generates a persistent device UUID.
- Registered devices are tracked in the database (`Device` model).
- Every new user defaults to an allowed device count of **1**.
- If a user attempts to log in from an unapproved device after reaching their limit, authentication is blocked with an informative message.
- Authorized administrators can view registered devices, revoke devices, and increase device limits in Django Admin.

### 3.5 Three-Minute Inactivity Session Timeout
- Both frontend and backend enforce a strict 3-minute (180-second) inactivity timeout.
- **Frontend:** Monitors user activity (`mousemove`, `keydown`, `click`, `scroll`, `touchstart`). If idle for 3 minutes, the session is cleared, cookies are invalidated, and the user is redirected to `/login?session_expired=1`.
- **Backend:** Tracks `last_activity` timestamp. If more than 180 seconds have elapsed since the user's last authenticated request, the request is rejected with `HTTP 401 Unauthorized` and cookies are cleared.

### 3.6 Brute-Force Login Protection
- Tracks consecutive failed login attempts.
- 5 consecutive failed attempts trigger an automatic **5-minute temporary lockout**.
- Generic authentication error messages prevent username/email enumeration.
- Frontend displays a live countdown timer and disables submission during the active lockout.

### 3.7 Forgot Password via Student ID & Gmail SMTP OTP
1. User enters their registered **Student ID** (placeholder `RU1122/19`). User does not supply or choose an email address.
2. System retrieves the user's previously registered email from the database.
3. System generates a secure 6-digit OTP valid for exactly 5 minutes.
4. OTP is sent via Gmail SMTP (`EmailMultiAlternatives` with HTML & plain text template).
5. OTP is stored securely hashed (SHA-256) in the database with rate-limiting and maximum 5 attempts.
6. Old unused OTPs are automatically invalidated when a new code is generated.
7. OTP values and passwords are never printed to CMD/terminal logs.
8. If SMTP configuration is missing or delivery fails, a clear error is returned and no active OTP is left in the database.
9. User enters the 6-digit OTP and receives a short-lived, single-use password reset token.
10. User sets their new password with full Argon2 hashing and complexity verification.

### 3.8 Role-Based Sidebars & Placeholder Pages
Each role has its own dedicated sidebar and protected routes:
- **Customer:** Home, My Orders, Profile
- **Café Owner:** Dashboard, Manage, My Cafe
- **Café Worker:** Manage Order, Recent Order, Profile
- **Admin:** Dashboard, Register Cafe

Dynamic welcome banner:
> *"Hello [Full Name]! You are logged in as a [Role]. These are the pages available to your account. More features will be introduced in Phase 2."*

Attempts by any role to access unauthorized URLs or APIs are rejected on both frontend route guards and backend permission classes (`IsCustomer`, `IsCafeOwner`, `IsCafeWorker`, `IsSystemAdmin`).

---

## 4. Setup and Installation Instructions

### 4.1 Backend Setup

1. Open PowerShell and navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

3. Run database migrations:
   ```powershell
   python manage.py makemigrations accounts
   python manage.py migrate
   ```

4. Seed Phase 1 test accounts for all four roles:
   ```powershell
   python manage.py seed_phase1_users
   ```

5. (Optional) Create an additional custom Django Superuser:
   ```powershell
   python manage.py createsuperuser
   ```

6. Start the Django development server:
   ```powershell
   python manage.py runserver 127.0.0.1:8000
   ```

### 4.2 Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Start the Vite development server:
   ```powershell
   npm run dev
   ```

3. Open your browser and navigate to:
   `http://localhost:5173`

---

## 5. Seed Test Credentials

The database comes pre-seeded with accounts for all four roles:

| Role | Email | Password | Allowed Devices |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gmail.com` | `AdminPassword123!` | 3 |
| **Café Owner** | `owner@gmail.com` | `OwnerPassword123!` | 2 |
| **Café Worker** | `worker@gmail.com` | `WorkerPassword123!` | 2 |
| **Customer** | `customer@gmail.com` | `CustomerPassword123!` | 1 |

---

## 6. Running Tests

### 6.1 Backend Tests (25 Security and Authorization Tests)
Run Django's test suite to verify all 25 Phase 1 security conditions:
```powershell
cd backend
python manage.py test accounts
```
*Tests coverage:*
- Customer registration and field validation
- Duplicate rejection for Student ID, Email, Phone, and FAN
- Gmail domain requirement enforcement
- Complex password policies and Argon2 hashing verification
- Privilege escalation prevention on public registration
- Email + password authentication
- Role sidebar and API endpoint access control
- Cross-role access denial (Customer $\rightarrow$ Cafe Owner, Cafe Owner $\rightarrow$ Admin)
- Unauthorized request rejection
- Forgot password OTP generation, 5-minute expiration, and single-use enforcement
- Brute-force failed login lockout and countdown
- Device registration and device limit enforcement
- Admin device limit adjustment
- 3-minute inactivity session timeout
- Logout token revocation and cookie clearance
- CSRF token verification

### 6.2 Frontend Tests
Run the frontend test suite:
```powershell
cd frontend
npm test
```
*Tests coverage:*
- Password complexity evaluation (all 5 rules live)
- Student ID pattern matching (`^RU\d{4}/\d{2}$`)
- Phone number pattern matching (`^(09|07)\d{8}$`)
- FAN numeric validation
- Email `@gmail.com` validation
- Role-to-dashboard redirection mapping
- Role sidebar permission tables
- 3-minute inactivity duration enforcement (180,000 ms)

---

## 7. Django Admin Access

Authorized administrators can access Django Admin at:
`http://127.0.0.1:8000/admin/`

Using the admin account:
- **Email:** `admin@gmail.com`
- **Password:** `AdminPassword123!`

In Django Admin, administrators can:
- Change user roles (e.g. promote a user to Café Owner or Café Worker)
- View registered devices and their IP addresses / user agents
- Revoke or deactivate devices
- Change a user's `allowed_devices` limit
- View password reset OTP audit records (without exposing plaintext secrets)

---

## 8. Gmail SMTP Configuration for Real Email Delivery

To deliver real OTP emails through Gmail:
1. Open `backend/.env`.
2. Locate the line:
   ```ini
   EMAIL_HOST_PASSWORD=PASTE_YOUR_GMAIL_APP_PASSWORD_HERE
   ```
3. Replace `PASTE_YOUR_GMAIL_APP_PASSWORD_HERE` with your 16-character **Google App Password** (generated from your Google Account with 2-Step Verification enabled at *Google Account > Security > 2-Step Verification > App passwords*).
4. Restart the Django development server:
   ```powershell
   python manage.py runserver 127.0.0.1:8000
   ```
5. On the frontend (`http://localhost:5173`), click **Forgot Password**, enter registered Student ID (e.g. `RU1122/19`), and check your Gmail inbox for the real 6-digit OTP email!
