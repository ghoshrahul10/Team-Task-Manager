from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MEMBER', 'Member'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MEMBER')


class Project(models.Model):
    name = models.CharField(max_length=255)
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_projects'   # ✅ FIX
    )
    
    members = models.ManyToManyField(
        User,
        related_name='member_projects'   # ✅ FIX
    )

    def __str__(self):
        return self.name

class Task(models.Model):
    STATUS_CHOICES = (
        ('TODO', 'Todo'),
        ('IN_PROGRESS', 'In Progress'),
        ('DONE', 'Done'),
    )

    title = models.CharField(max_length=255)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    due_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.title