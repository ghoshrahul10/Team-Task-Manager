from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    message = 'Only admin users can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )
