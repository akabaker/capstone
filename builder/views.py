from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import SESSION_KEY, BACKEND_SESSION_KEY, load_backend
from django.contrib.auth.models import AnonymousUser
from wayfinder.builder.models import Node
from wayfinder.builder.userinfo import UserInfo
from django import forms
import urllib

def user_from_session_key(session_key):
    session_engine = __import__(settings.SESSION_ENGINE, {}, {}, [''])
    session_wrapper = session_engine.SessionStore(session_key)
    user_id = session_wrapper.get(SESSION_KEY)
    auth_backend = load_backend(session_wrapper.get(BACKEND_SESSION_KEY))

    if user_id and auth_backend:
      return auth_backend.get_user(user_id)
    else:
      return AnonymousUser()

@csrf_exempt
def savemap(request):
	markers = json.loads(request.raw_post_data)
	request.session['markers'] = markers
	mine = request.session['markers']
		
	return HttpResponse(json.dumps(mine), mimetype='application/json')

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            new_user = form.save()
            return HttpResponseRedirect('/builder/')
    else:
        form = UserCreationForm()
    return render_to_response('registration/register.html', {
        'form': form,
    })

@csrf_exempt
def geo_code(request):
	# JSON object must be loaded with raw_post_data method
	geodata = json.loads(request.raw_post_data)

	address = geodata.get('address', False)
	sensor = geodata.get('sensor', False)
	geocodeurl = geodata.get('geoCodeURL', False)
	geo_args = {
		'address': address,
		'sensor': sensor
	}

	url = geocodeurl + '?' + urllib.urlencode(geo_args)
	result = json.load(urllib.urlopen(url))

	return HttpResponse(json.dumps(result), mimetype='application/json')
