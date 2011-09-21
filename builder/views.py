from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django import forms
import urllib

def builder(request):
	return render_to_response('builder.html', context_instance=RequestContext(request))

@csrf_exempt
def save_state(request):
	mapstate = json.loads(request.raw_post_data)

	request.session['startpoints'] = mapstate
	
	return HttpResponse(request.session.get('startpoints'));

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            new_user = form.save()
            return HttpResponseRedirect("/builder/")
    else:
        form = UserCreationForm()
    return render_to_response("registration/register.html", {
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

@csrf_exempt
def find_path(request):
	map_overlays = json.loads(request.raw_post_data)
	polylines = map_overlays.get('polylines')
	bounds = map_overlays.get('mapbounds')
	shapes = map_overlays.get('shapes')
	startpoints = map_overlays.get('startpoints')
	endpoints = map_overlays.get('endpoints')

	return HttpResponse(json.dumps(shapes), mimetype='application/json')
