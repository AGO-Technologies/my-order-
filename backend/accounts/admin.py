from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Device, PasswordResetOTP


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = (
        'email',
        'full_name',
        'role',
        'allowed_devices',
        'student_id',
        'phone_number',
        'is_active',
        'is_staff',
        'date_joined',
    )
    list_filter = ('role', 'is_active', 'is_staff', 'zone')
    search_fields = ('email', 'full_name', 'student_id', 'phone_number', 'fan')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {
            'fields': (
                'full_name',
                'student_id',
                'phone_number',
                'fan',
                'zone',
                'block',
                'room',
            )
        }),
        ('Role & Device Permissions', {
            'fields': (
                'role',
                'allowed_devices',
                'failed_login_attempts',
                'lockout_until',
                'last_activity',
            )
        }),
        ('System Permissions', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    readonly_fields = ('last_login', 'date_joined', 'last_activity')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email',
                'full_name',
                'role',
                'password1',
                'password2',
                'allowed_devices',
            ),
        }),
    )


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'device_name',
        'device_id_short',
        'ip_address',
        'is_active',
        'created_at',
        'last_used_at',
    )
    list_filter = ('is_active', 'created_at', 'last_used_at')
    search_fields = ('user__email', 'user__full_name', 'device_name', 'device_id', 'ip_address')
    readonly_fields = ('created_at', 'last_used_at')
    actions = ['deactivate_devices', 'activate_devices']

    def device_id_short(self, obj):
        return f"{obj.device_id[:12]}..." if len(obj.device_id) > 12 else obj.device_id
    device_id_short.short_description = 'Device Identifier'

    @admin.action(description='Revoke / Deactivate selected devices')
    def deactivate_devices(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} device(s) deactivated.")

    @admin.action(description='Activate selected devices')
    def activate_devices(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} device(s) activated.")


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'created_at',
        'expires_at',
        'is_used',
        'attempts',
        'is_expired_display',
    )
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'user__full_name')
    readonly_fields = ('user', 'otp_hash', 'created_at', 'expires_at', 'is_used', 'attempts')

    def is_expired_display(self, obj):
        return obj.is_expired
    is_expired_display.boolean = True
    is_expired_display.short_description = 'Expired'

    def has_add_permission(self, request):
        return False
