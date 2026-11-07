import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class ComplexPasswordValidator:
    """
    Validates that a password meets complexity rules:
    - At least 9 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    def validate(self, password, user=None):
        if len(password) < 9:
            raise ValidationError(
                _("Password must contain at least 9 characters."),
                code='password_too_short',
            )
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password must contain at least one uppercase letter."),
                code='password_no_upper',
            )
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Password must contain at least one lowercase letter."),
                code='password_no_lower',
            )
        if not re.search(r'\d', password):
            raise ValidationError(
                _("Password must contain at least one number."),
                code='password_no_number',
            )
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;\'`/]', password):
            raise ValidationError(
                _("Password must contain at least one special character."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least 9 characters, including at least one uppercase letter, "
            "one lowercase letter, one number, and one special character."
        )


def validate_student_id(value: str):
    if not value or not re.match(r'^[Rr][Uu]\d{4}/\d{2}$', value):
        raise ValidationError(
            "Student ID must follow format RU followed by 4 digits, slash, and 2 digits (e.g. RU0101/16).",
            code='invalid_student_id'
        )


def validate_gmail(value: str):
    if not value or not value.lower().endswith('@gmail.com'):
        raise ValidationError(
            "Only Gmail addresses (@gmail.com) are accepted.",
            code='invalid_gmail'
        )


def validate_phone_number(value: str):
    if not value or not re.match(r'^(09|07)\d{8}$', value):
        raise ValidationError(
            "Phone number must be exactly 10 digits and begin with 09 or 07.",
            code='invalid_phone_number'
        )


def validate_fan(value: str):
    if not value or not re.match(r'^\d+$', value):
        raise ValidationError(
            "FAN must contain numeric characters only.",
            code='invalid_fan'
        )


def validate_block_or_room(value: str, field_name: str = "Field"):
    if not value or not re.match(r'^\d{1,2}$', str(value)):
        raise ValidationError(
            f"{field_name} must be a 1-2 digit number.",
            code='invalid_number'
        )
