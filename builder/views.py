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
from django.utils.html import strip_tags
from wayfinder.builder.models import Nodes, Paths
from wayfinder.builder.forms import FindPath, UpdateNode
from numpy import sin, cos, sqrt, radians, arctan2, ceil
from math import asin
from django import forms
import time
import urllib
import Pathfind

#=== Helper functions ===#
def haversine(lon1, lat1, lon2, lat2):
	# convert decimal degrees to radians 
	lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
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
#=== Django views ===#

# Must render template with the correct RequestContext for access to user auth data
def builder(request):
	"""The index page, returns the view with the proper context_instance to ensure that the 
	user session is available. 

	"""
	return render_to_response('builder.html', context_instance=RequestContext(request))

def register(request):
	"""Register view for creating new users, this is a pre-cooked view courtesy of Django documenation"""
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

@login_required
def label_list(request):
	"""Used by findpath for autocomplete functionality -- allows for search of destinations"""
	if request.method == 'GET':
		term = request.GET.get('term')
		labels = Nodes.objects.filter(label__isnull=False, label__icontains=term).order_by('label')
		label_list = []
		for label in labels:
			label_list.append(label.label)

		return HttpResponse(json.dumps(label_list), mimetype='application/json')

def closest_nodes(request):
	"""Returns a list of nodes that are nearby

	Generate a list of known destination nodes, then iterate through the list using the haversine
	function to determine if distance from starting LOC to destination is less than 2 miles.

	"""
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

		if len(dests) == 0:
			return Http404
		else:
			return HttpResponse(json.dumps(dests), mimetype='application/json')

@login_required
def dest_list(request):
	"""Return a list of destination objects"""
	if request.method == 'GET':
		dest_list = Nodes.objects.filter(label__isnull=False).order_by('label')
		return render_to_response('destlist.html', {'nodes': dest_list})

@user_passes_test(lambda u: u.has_perm('builder.add_nodes'))
def load_nodes(request):
	"""Loads nodes using Django serializer

	Returns:
	jsondata -- json object containing a list of node objects

	"""

	jsondata = serializers.serialize('json', Nodes.objects.all(), fields=('lat','lng','label'))
	return HttpResponse(json.dumps(jsondata), mimetype='application/json')

@user_passes_test(lambda u: u.has_perm('builder.add_nodes'))
def update_node(request):
	"""Update label property for node (a labeled node is considered a destination)"""
	if request.method == 'POST':
		form = UpdateNode(request.POST)

		if form.is_valid():
			cd = form.cleaned_data

			coords = request.POST.get('coords')	
			lat = coords.split(',')[0]
			lng = coords.split(',')[1]
			
			# Locate the node that we're going to label
			n = Nodes.objects.filter(lat=lat, lng=lng)

			d = {}
			d['label'] = strip_tags(cd['label'])
			# Update model with kwargs expansion
			n.update(**d)
			return HttpResponse(json.dumps({'success': d['label']}))
		else: 
			return HttpResponse(json.dumps({'errors': form.errors}))

@csrf_exempt
@user_passes_test(lambda u: u.has_perm('builder.delete_nodes'))
def delete_node(request):
	"""Delete a single node"""
	if request.method == 'POST':
		coords = request.POST.get('coords')
		lat = coords.split(',')[0]
		lng = coords.split(',')[1]
		n = Nodes.objects.filter(lat=lat, lng=lng)
		n.delete()
		return HttpResponse('node deleted')

@csrf_exempt
def clear_map(request):
	"""Deletes all paths and nodes"""
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
	"""Saves node to Nodes model

	Arguments:
	request.POST.coords -- lat,lng pair of the new node

	Returns:
	success message (string)

	"""

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
	"""Use Django serializer to dump paths as json. Use_natural_keys calls the
	Paths manager to serialize only lat,lng and not the pk of each row.
	"""

	jsondata = serializers.serialize('json', Paths.objects.all(), use_natural_keys=True)
	return HttpResponse(json.dumps(jsondata), mimetype='application/json')

@csrf_exempt
@user_passes_test(lambda u: u.has_perm('builder.add_paths'))
def create_path(request):
	"""Inserts a pair of lat,lng coords into Paths

	Arguments:
	request.POST.node1 -- lat,lng pair of path's first node
	request.POST.node2 -- lat,lng pair of path's seconds node

	Returns:
	Node1 and node2 coordinates (string)

	"""

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

def find_path(request):
	"""Take user starting position, destination and calculate shortest path

	Arguments:
	request.POST.start -- contains lat,lng pair of the starting position
	request.POST.end -- contains the name of the destination (node label)

	Returns:
	path_data -- json encoded list object. contains the route length, time to traverse route
	and the list of lat,lng pairs (path)

	"""

	AVG_WALKING_SPEED = 3.4 #miles per hour

	if request.method == 'POST':
		form = FindPath(request.POST)

		if form.is_valid():
			cd = form.cleaned_data

			start_node = {
				'lat': cd['start'].split(',')[0],
				'lng': cd['start'].split(',')[1]
			}

			try: 
				end_node = Nodes.objects.get(label=cd['end'])
			except DoesNotExist:
				return HttpResponse(json.dumps({'errors': 'Unable to find destination'}, mimetype='application/json'))
	
			start = [float(start_node['lat']), float(start_node['lng'])]
			end = [end_node.lat, end_node.lng]
			try:
				start_time = time.time()
				#This function call returns the polyline to be drawn
				path = Pathfind.pathFind(start, end)
			except Exception, ValueError:
				return HttpResponse(json.dumps({'errors': 'Unable to validate start point'}, mimetype='application/json'))
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

				#Calculate the distance from the user's starting position to the first node and add to the distance value
				d += haversine(returnedPath[0][1],returnedPath[0][0], returnedPath[1][1], returnedPath[1][0])

				path_data['returned_path'] = returnedPath	

				#Distance traversed from the users location to the end node
				path_data['distance'] = round(d, 3)

				#Estimated walking time in minutes
				path_data['walking_time'] = round((path_data['distance'] / AVG_WALKING_SPEED) * 60, 2)
				return HttpResponse(json.dumps(path_data), mimetype='application/json')
		else:
			return HttpResponse(json.dumps({'errors': 'Please fill out all form fields'}, mimetype='application/json'))
