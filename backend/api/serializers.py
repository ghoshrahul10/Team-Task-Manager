from rest_framework import serializers
from .models import User, Project, Task
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']


class ProjectSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Project
        fields = ['id', 'name', 'created_by', 'members']

    def validate_members(self, members):
        if not members:
            raise serializers.ValidationError('Add at least one project member.')
        return members


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

    def validate(self, attrs):
        project = attrs.get('project') or getattr(self.instance, 'project', None)
        assigned_to = attrs.get('assigned_to') or getattr(self.instance, 'assigned_to', None)
        request = self.context.get('request')

        if project and assigned_to:
            is_member = project.members.filter(id=assigned_to.id).exists()
            is_creator = project.created_by_id == assigned_to.id
            if not is_member and not is_creator:
                raise serializers.ValidationError(
                    {'assigned_to': 'Assigned user must belong to the selected project.'}
                )

        if request and request.method == 'POST' and project:
            user = request.user
            if user.role == 'ADMIN' and project.created_by_id != user.id:
                raise serializers.ValidationError(
                    {'project': 'You can create tasks only for projects you created.'}
                )

        return attrs
