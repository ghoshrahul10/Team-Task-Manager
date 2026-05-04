from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import Project, Task
from .serializers import (
    ProjectSerializer,
    TaskSerializer,
    UserPublicSerializer,
    UserSerializer,
)
from .permissions import IsAdminRole
from django.contrib.auth import get_user_model

User = get_user_model()

# Signup API
class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class CurrentUserView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserPublicSerializer
    permission_classes = [permissions.IsAuthenticated]


# Project APIs
class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Project.objects.filter(created_by=user).distinct()
        return Project.objects.filter(members=user).distinct()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        project.members.add(self.request.user)


# Task APIs
class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Task.objects.filter(
                Q(project__created_by=user) | Q(assigned_to=user)
            ).distinct()
        return Task.objects.filter(
            Q(assigned_to=user) | Q(project__members=user)
        ).distinct()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save()


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Task.objects.filter(
                Q(project__created_by=user) | Q(assigned_to=user)
            ).distinct()
        return Task.objects.filter(assigned_to=user).distinct()

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [permissions.IsAuthenticated(), IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'MEMBER':
            serializer.save(
                title=self.get_object().title,
                project=self.get_object().project,
                assigned_to=self.get_object().assigned_to,
                due_date=self.get_object().due_date,
            )
            return
        serializer.save()


class DashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tasks = self.get_tasks(request.user)
        today = timezone.localdate()

        data = {
            'total_tasks': tasks.count(),
            'todo': tasks.filter(status='TODO').count(),
            'in_progress': tasks.filter(status='IN_PROGRESS').count(),
            'done': tasks.filter(status='DONE').count(),
            'overdue': tasks.filter(due_date__lt=today).exclude(status='DONE').count(),
            'projects': self.get_projects(request.user).count(),
        }
        return Response(data)

    def get_tasks(self, user):
        if user.role == 'ADMIN':
            return Task.objects.filter(
                Q(project__created_by=user) | Q(assigned_to=user)
            ).distinct()
        return Task.objects.filter(assigned_to=user).distinct()

    def get_projects(self, user):
        if user.role == 'ADMIN':
            return Project.objects.filter(created_by=user).distinct()
        return Project.objects.filter(members=user).distinct()
