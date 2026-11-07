import hashlib
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class UserRole(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Customer'
    CAFE_OWNER = 'CAFE_OWNER', 'Café Owner'
    CAFE_WORKER = 'CAFE_WORKER', 'Café Worker'
    ADMIN = 'ADMIN', 'Admin'


class CustomUserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not full_name:
            raise ValueError('The Full Name field must be set')
        
        email = self.normalize_email(email).lower()
        extra_fields.setdefault('role', UserRole.CUSTOMER)
        
        user = self.model(email=email, full_name=full_name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        db_index=True
    )

    # Customer specific fields
    student_id = models.CharField(max_length=20, unique=True, null=True, blank=True, db_index=True)
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True, db_index=True)
    fan = models.CharField(max_length=50, unique=True, null=True, blank=True, db_index=True)
    zone = models.IntegerField(
        null=True,
        blank=True,
        choices=[(1, 'Zone 1'), (2, 'Zone 2'), (3, 'Zone 3'), (4, 'Zone 4')]
    )
    block = models.CharField(max_length=10, null=True, blank=True)
    room = models.CharField(max_length=10, null=True, blank=True)

    # Security & device controls
    allowed_devices = models.PositiveIntegerField(default=1)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    lockout_until = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_locked_out(self):
        if self.lockout_until and timezone.now() < self.lockout_until:
            return True
        return False

    def remaining_lockout_seconds(self):
        if self.is_locked_out:
            return int((self.lockout_until - timezone.now()).total_seconds())
        return 0


class Device(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_id = models.CharField(max_length=255, db_index=True)
    device_name = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'device_id')
        ordering = ['-last_used_at']
        verbose_name = 'Registered Device'
        verbose_name_plural = 'Registered Devices'

    def __str__(self):
        status = "Active" if self.is_active else "Revoked"
        return f"{self.user.email} - {self.device_name or self.device_id[:8]} ({status})"


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_otps')
    otp_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Password Reset OTP'
        verbose_name_plural = 'Password Reset OTPs'

    @classmethod
    def hash_otp(cls, otp_str: str) -> str:
        return hashlib.sha256(otp_str.encode('utf-8')).hexdigest()

    def check_otp(self, plain_otp: str) -> bool:
        return self.otp_hash == self.hash_otp(plain_otp)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired and self.attempts < 5
