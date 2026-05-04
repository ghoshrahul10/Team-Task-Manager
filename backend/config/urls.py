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
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html')),
    path('admin/', admin.site.urls),

    # Auth
    path('signup/', SignupView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('api-auth/', include('rest_framework.urls')),
    path('me/', CurrentUserView.as_view()),
    path('users/', UserListView.as_view()),

    # Project
    path('projects/', ProjectListCreateView.as_view()),

    # Task
    path('tasks/', TaskListCreateView.as_view()),
    path('tasks/<int:pk>/', TaskDetailView.as_view()),

    # Dashboard
    path('dashboard/', DashboardView.as_view()),
]
