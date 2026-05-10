from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

from api.views import (
    CurrentUserView,
    DashboardView,
    ProjectListCreateView,
    SignupView,
    TaskDetailView,
    TaskListCreateView,
    UserListView,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [

    # ✅ API ROUTES
    path('api/signup/', SignupView.as_view()),
    path('api/login/', TokenObtainPairView.as_view()),
    path('api/refresh/', TokenRefreshView.as_view()),
    path('api/me/', CurrentUserView.as_view()),
    path('api/users/', UserListView.as_view()),
    path('api/projects/', ProjectListCreateView.as_view()),
    path('api/tasks/', TaskListCreateView.as_view()),
    path('api/tasks/<int:pk>/', TaskDetailView.as_view()),
    path('api/dashboard/', DashboardView.as_view()),

    path('api-auth/', include('rest_framework.urls')),

    # Admin
    path('admin/', admin.site.urls),

    # Frontend
    path('', TemplateView.as_view(template_name='index.html')),
]