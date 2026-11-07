import re
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import User, UserRole, Device, PasswordResetOTP
from .validators import (
    validate_student_id,
    validate_gmail,
    validate_phone_number,
    validate_fan,
    validate_block_or_room,
    ComplexPasswordValidator,
)


class CustomerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    zone = serializers.IntegerField(required=True)
    block = serializers.CharField(required=True, max_length=10)
    room = serializers.CharField(required=True, max_length=10)

    class Meta:
        model = User
        fields = [
            'full_name',
            'student_id',
            'email',
            'phone_number',
            'fan',
            'zone',
            'block',
            'room',
            'password',
            'confirm_password',
        ]

    def validate_full_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Full Name is required and cannot be empty or whitespace only.")
        return val

    def validate_student_id(self, value):
        val = value.strip()
        try:
            validate_student_id(val)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        if User.objects.filter(student_id__iexact=val).exists():
            raise serializers.ValidationError("A user with this Student ID already exists.")
        return val

    def validate_email(self, value):
        val = value.strip().lower()
        try:
            validate_gmail(val)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        if User.objects.filter(email__iexact=val).exists():
            raise serializers.ValidationError("A user with this Email address already exists.")
        return val

    def validate_phone_number(self, value):
        val = value.strip()
        try:
            validate_phone_number(val)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        if User.objects.filter(phone_number=val).exists():
            raise serializers.ValidationError("A user with this Phone Number already exists.")
        return val

    def validate_fan(self, value):
        val = value.strip()
        try:
            validate_fan(val)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        if User.objects.filter(fan=val).exists():
            raise serializers.ValidationError("A user with this FAN already exists.")
        return val

    def validate_zone(self, value):
        if value not in [1, 2, 3, 4]:
            raise serializers.ValidationError("Zone must be selected from options: 1, 2, 3, or 4.")
        return value

    def validate_block(self, value):
        val = str(value).strip()
        try:
            validate_block_or_room(val, "Block")
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        return val

    def validate_room(self, value):
        val = str(value).strip()
        try:
            validate_block_or_room(val, "Room")
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        return val

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({'confirm_password': "Passwords do not match."})

        # Check personal info similarity
        full_name = attrs.get('full_name', '')
        email = attrs.get('email', '')
        student_id = attrs.get('student_id', '')
        phone_number = attrs.get('phone_number', '')
        fan = attrs.get('fan', '')

        # Check if password is too similar to personal attributes
        lower_pass = password.lower()
        if student_id and student_id.lower() in lower_pass:
            raise serializers.ValidationError({'password': "Password must not contain your Student ID."})
        if phone_number and phone_number in lower_pass:
            raise serializers.ValidationError({'password': "Password must not contain your Phone Number."})
        if fan and fan in lower_pass:
            raise serializers.ValidationError({'password': "Password must not contain your FAN."})
        
        email_user = email.split('@')[0].lower() if '@' in email else ''
        if len(email_user) >= 3 and email_user in lower_pass:
            raise serializers.ValidationError({'password': "Password must not be too similar to your email address."})

        # Validate with custom complexity validator
        comp_validator = ComplexPasswordValidator()
        try:
            comp_validator.validate(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': e.messages})

        # Validate with Django standard password validators
        # Create a mock user instance for similarity checks
        temp_user = User(
            email=attrs.get('email', ''),
            full_name=attrs.get('full_name', '')
        )
        try:
            validate_password(password, user=temp_user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': e.messages})

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        # Security: strictly enforce role is CUSTOMER
        validated_data['role'] = UserRole.CUSTOMER
        validated_data['allowed_devices'] = 1

        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'student_id',
            'phone_number',
            'fan',
            'zone',
            'block',
            'room',
            'allowed_devices',
            'date_joined',
        ]
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    device_id = serializers.CharField(required=True, max_length=255)
    device_name = serializers.CharField(required=False, default="Browser", max_length=255)


class ForgotPasswordSerializer(serializers.Serializer):
    student_id = serializers.CharField(required=True, max_length=20)

    def validate_student_id(self, value):
        val = value.strip()
        try:
            validate_student_id(val)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message)
        return val


class VerifyOTPSerializer(serializers.Serializer):
    student_id = serializers.CharField(required=False, max_length=20)
    email = serializers.EmailField(required=False)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate(self, attrs):
        if not attrs.get('student_id') and not attrs.get('email'):
            raise serializers.ValidationError({"student_id": "Student ID is required."})
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    reset_token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password != confirm_password:
            raise serializers.ValidationError({'confirm_password': "Passwords do not match."})

        comp_validator = ComplexPasswordValidator()
        try:
            comp_validator.validate(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': e.messages})

        try:
            validate_password(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': e.messages})

        return attrs
