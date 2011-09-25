from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from wayfinder.builder.models import Map, Node
from wayfinder.builder.forms import NewMap
from django import forms
import urllib

# Must render template with the correct RequestContext for access to user auth data
def builder(request):
	return render_to_response('builder.html', context_instance=RequestContext(request))

def newmap(request):
	if request.method == 'POST':
		form = NewMap(request.POST)

		if form.is_valid():
			cd = form.cleaned_data
			user = user_from_session_key(request.COOKIES['sessionid'])
			
			m = Map(
				user = user,
				name = cd['name'],
				description = cd['description'],
				bounds_sw_lat = cd['bounds_sw_lat'],
				bounds_sw_lng = cd['bounds_sw_lng'],
				bounds_ne_lat = cd['bounds_ne_lat'],
				bounds_ne_lng = cd['bounds_ne_lng'],
			)

			m.save()

			return HttpResponse('saved')
	else:
		form = NewMap()
	return render_to_response('newmap.html', { 'form': form })

def user_from_session_key(session_key):
	"""Returns user instance - grabs the sessionid from cookie and looks up the user"""
    from django.conf import settings
    from django.contrib.auth import SESSION_KEY, BACKEND_SESSION_KEY, load_backend
    from django.contrib.auth.models import AnonymousUser

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
	"""Simple user registration"""
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
	"""Process geocode request"""
	
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

@csrf_exempt
def save_state(request):
	mapstate = json.loads(request.raw_post_data)

	request.session['startpoints'] = mapstate
	
	return HttpResponse(request.session.get('startpoints'));
