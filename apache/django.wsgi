import os, sys

#PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.append('/var/www/development')

os.environ['DJANGO_SETTINGS_MODULE'] = 'wayfinder.settings'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()
