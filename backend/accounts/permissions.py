from rest_framework.permissions import BasePermission
from .models import UserRole


class IsCustomer(BasePermission):
    message = "Access restricted to Customer accounts."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.CUSTOMER
        )


class IsCafeOwner(BasePermission):
    message = "Access restricted to Café Owner accounts."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.CAFE_OWNER
        )


class IsCafeWorker(BasePermission):
    message = "Access restricted to Café Worker accounts."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.CAFE_WORKER
        )


class IsSystemAdmin(BasePermission):
    message = "Access restricted to System Admin accounts."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == UserRole.ADMIN
        )
