from django.utils import timezone
from django.conf import settings
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken


class InactivityTimeoutMiddleware:
    """
    Enforces a strict 3-minute (180s) inactivity timeout on the backend.
    If an authenticated user has been inactive for > 180s, the request is rejected
    with 401 Unauthorized, cookies are cleared, and the session is terminated.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.timeout_seconds = getattr(settings, 'INACTIVITY_TIMEOUT_SECONDS', 180)
        self.exempt_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/forgot-password/',
            '/api/auth/verify-otp/',
            '/api/auth/reset-password/',
            '/api/auth/csrf/',
        ]

    def __call__(self, request):
        path = request.path
        if any(path.startswith(p) for p in self.exempt_paths):
            return self.get_response(request)

        # DRF authentication runs at view level, but for cookie-based JWT or session:
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            now = timezone.now()
            last_activity = user.last_activity

            if last_activity:
                elapsed = (now - last_activity).total_seconds()
                if elapsed > self.timeout_seconds:
                    # Inactivity timeout exceeded!
                    # Reset last_activity and clear cookies
                    user.last_activity = None
                    user.save(update_fields=['last_activity'])

                    response = JsonResponse(
                        {
                            "detail": "Session expired due to 3 minutes of inactivity. Please log in again.",
                            "code": "session_expired"
                        },
                        status=401
                    )
                    response.delete_cookie('access_token', path='/')
                    response.delete_cookie('refresh_token', path='/')
                    return response

            # Update last activity
            # Use update_fields to be fast and safe
            user.last_activity = now
            user.save(update_fields=['last_activity'])

        response = self.get_response(request)
        return response
