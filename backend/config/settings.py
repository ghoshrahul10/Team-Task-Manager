import os
from pathlib import Path
import dj_database_url

# MySQL support (IMPORTANT)
import pymysql
pymysql.install_as_MySQLdb()

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = BASE_DIR.parent / 'frontend' / 'dist'

# SECURITY
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-s5%tvupo82j_oa&fqq1^iit+0^s0v823wm3t8t+3n^)swtyp34',
)

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    '.railway.app',
    '.up.railway.app',
]

railway_public_domain = os.environ.get('RAILWAY_PUBLIC_DOMAIN')
if railway_public_domain:
    ALLOWED_HOSTS.append(railway_public_domain)

CSRF_TRUSTED_ORIGINS = [
    'http://127.0.0.1:5175',
    'http://localhost:5175',
    'https://*.railway.app',
    'https://*.up.railway.app',
]

# APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'corsheaders',
    'api',
]

# MIDDLEWARE
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# TEMPLATES
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [FRONTEND_DIST_DIR, BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ================= DATABASE =================

# Default (local)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Railway MySQL (production)
database_url = os.environ.get('DATABASE_URL')

if database_url:
    DATABASES['default'] = dj_database_url.parse(
        database_url,
        conn_max_age=600,
        ssl_require=False  # Railway MySQL usually doesn't need SSL
    )

# ============================================

# PASSWORD VALIDATION
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# INTERNATIONALIZATION
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# STATIC FILES
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

if FRONTEND_DIST_DIR.exists():
    STATICFILES_DIRS = [FRONTEND_DIST_DIR]

# CORS
CORS_ALLOW_ALL_ORIGINS = True

# CUSTOM USER
AUTH_USER_MODEL = 'api.User'

# DRF
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
}