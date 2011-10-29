from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse, HttpResponseForbidden, Http404
from django.utils import simplejson as json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import SESSION_KEY, BACKEND_SESSION_KEY, load_backend
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import AnonymousUser
from django.core import serializers
from wayfinder.builder.models import Nodes, Paths
from wayfinder.builder.forms import FindPath
from numpy import sin, cos, sqrt, radians, arctan2, ceil
import time
from math import asin
from django import forms
import urllib
import Pathfind

#=== Helper functions ===#
def haversine(lon1, lat1, lon2, lat2):
	# convert decimal degrees to radians 
	lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
	# haversine formula 
	dlon = lon2 - lon1 
	dlat = lat2 - lat1 
	a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
	c = 2 * asin(sqrt(a)) 
	#km = 6367 * c
	#6367 radius of the earth in km
	#3961 radius of the earth in miles
	miles = 3961 * c
	return miles

def user_from_session_key(session_key):
    session_engine = __import__(settings.SESSION_ENGINE, {}, {}, [''])
    session_wrapper = session_engine.SessionStore(session_key)
    user_id = session_wrapper.get(SESSION_KEY)
    auth_backend = load_backend(session_wrapper.get(BACKEND_SESSION_KEY))

    if user_id and auth_backend:
      return auth_backend.get_user(user_id)
    else:
      return AnonymousUser()

def user_in_group(user, group):
	in_group = user.groups.filter(name='{0}'.format(group)).count()
	if in_group == 0:
		return False
	else:
		return True

def user_authenticated(request):
	if request.method == 'GET':
		if request.user.is_authenticated():
			return HttpResponse('is')
		else:
			return HttpResponseForbidden()

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

#=== Django views ===#

# Must render template with the correct RequestContext for access to user auth data
def builder(request):
	return render_to_response('builder.html', context_instance=RequestContext(request))

@login_required
def label_list(request):
	if request.method == 'GET':
		term = request.GET.get('term')
		labels = Nodes.objects.filter(label__isnull=False, label__icontains=term).order_by('label')
		label_list = []
		for label in labels:
			label_list.append(label.label)

		return HttpResponse(json.dumps(label_list), mimetype='application/json')

def closest_nodes(request):
	if request.method == 'GET':
		lat = request.GET.get('lat')
		lng = request.GET.get('lng')
		dest_list = Nodes.objects.filter(label__isnull=False).order_by('label')
		dests = []
		for dest in dest_list:
			d = haversine(float(lng), float(lat), dest.lng, dest.lat)
			# Destinations within 2 miles
			if d <= 2.0:
				dests.append({
					'lat': dest.lat,
					'lng': dest.lng,
					'label': dest.label,
					'distance': d
				})

		return HttpResponse(json.dumps(dests), mimetype='application/json')

@login_required
def dest_list(request):
	if request.method == 'GET':
		dest_list = Nodes.objects.filter(label__isnull=False).order_by('label')
		return render_to_response('destlist.html', {'nodes': dest_list})

@user_passes_test(lambda u: u.has_perm('builder.add_nodes'))
def load_nodes(request):
	jsondata = serializers.serialize('json', Nodes.objects.all(), fields=('lat','lng','label'))
	return HttpResponse(json.dumps(jsondata), mimetype='application/json')

@csrf_exempt
@user_passes_test(lambda u: u.has_perm('builder.add_nodes'))
def update_node(request):
	if request.method == 'POST':
		coords = request.POST.get('coords')	
		lat = coords.split(',')[0]
		lng = coords.split(',')[1]
		if request.POST.get('label') == "":
			label = None
		else:
			label = request.POST.get('label')

		n = Nodes.objects.filter(lat=lat, lng=lng)

		if not n:
			n = Nodes(
				lat = lat,
				lng = lng,
				label = request.POST.get('label')
			)
			n.save()
			return HttpResponse('node created')

		else:
			d = {}
			d['label'] = label
			# Update model with kwargs expansion
			n.update(**d)

		return HttpResponse('node updated')

@csrf_exempt
@user_passes_test(lambda u: u.has_perm('builder.delete_nodes'))
def delete_node(request):
	if request.method == 'POST':
		coords = request.POST.get('coords')
		lat = coords.split(',')[0]
		lng = coords.split(',')[1]
		n = Nodes.objects.filter(lat=lat, lng=lng)
		n.delete()
		return HttpResponse('node deleted')

@csrf_exempt
def clear_map(request):
	perm_list = ['builder.delete_nodes', 'builder.delete_paths']
	if request.user.is_authenticated() and request.user.has_perms(perm_list):
		p = Paths.objects.all()
		p.delete()
		n = Nodes.objects.all()
		n.delete()

		return HttpResponse('map cleared')
	else:
		return HttpResponseForbidden()

@csrf_exempt
@user_passes_test(lambda u: u.has_perm('builder.add_nodes'))
def create_node(request):
	if request.method == 'POST':
		coords = request.POST.get('coords')
		lat = coords.split(',')[0]
		lng = coords.split(',')[1]

		n = Nodes(
			lat = lat,
			lng = lng
		)

		n.save()
		return HttpResponse('node created')

@csrf_exempt
@user_passes_test(lambda u: u.has_perm('builder.add_paths'))
def load_paths(request):
	jsondata = serializers.serialize('json', Paths.objects.all(), use_natural_keys=True)
	return HttpResponse(json.dumps(jsondata), mimetype='application/json')

@csrf_exempt
@user_passes_test(lambda u: u.has_perm('builder.add_paths'))
def create_path(request):
	if request.method == 'POST':
		pathNode1 = request.POST.get('node1')
		pathNode2 = request.POST.get('node2')

		node1 = Nodes.objects.get(lat=pathNode1.split(',')[0], lng=pathNode1.split(',')[1])	
		node2 = Nodes.objects.get(lat=pathNode2.split(',')[0], lng=pathNode2.split(',')[1])	

		p = Paths(
			node1 = node1,
			node2 = node2
		)

		p.save()
		return HttpResponse("node1: {0} node2: {1}".format(node1, node2))

@csrf_exempt
def find_path(request):
	AVG_WALKING_SPEED = 3.3

	if request.method == 'POST':
		form = FindPath(request.POST)

		if form.is_valid():
			cd = form.cleaned_data

			start_node = {
				'lat': cd['start'].split(',')[0],
				'lng': cd['start'].split(',')[1]
			}

			end_node = Nodes.objects.get(label=cd['end'])
	
			#This function call should return the polyline to be drawn
			start = [float(start_node['lat']), float(start_node['lng'])]
			end = [end_node.lat, end_node.lng]
			try:
				start_time = time.time()
				path = Pathfind.pathFind(start, end)
			except RuntimeError:
				return Http404('Unable to find path')
			else:
				returnedPath = []
				path_data = {}
				path_data['time_to_find'] = round(time.time() - start_time, 3)
				prev = "" #Previous node
				d = 0 #Total traversed distance
				for p in path:
					returnedPath.append([p[0],p[1]])
					if len(prev) == 0:
						prev = p
					else:
						d+=haversine(p[1],p[0],prev[1],prev[0])
						prev = p

				#Add our starting location to the front of the list
				returnedPath.insert(0, start)
				d += haversine(returnedPath[0][1],returnedPath[0][0], returnedPath[1][1], returnedPath[1][0])
				path_data['returned_path'] = returnedPath	
				#Distance traversed from the users location to the end node
				path_data['distance'] = round(d, 3)
				#Estimated walking time in minutes
				path_data['walking_time'] = round((path_data['distance'] / AVG_WALKING_SPEED) * 60, 2)
				return HttpResponse(json.dumps(path_data), mimetype='application/json')
		else:
			return HttpResponse('invalid')
