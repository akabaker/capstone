from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse, HttpResponseForbidden
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
			#d['label'] = request.POST.get('label')
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

@login_required
def find_path(request):
	if request.method == 'POST':
		form = FindPath(request.POST)

		if form.is_valid():
			cd = form.cleaned_data

			start = cd['start']
			end_node = Nodes.objects.get(label=cd['end'])
	
			#TODO: magic goes here

			return HttpResponse(str(start))

		else:
			return HttpResponse('invalid')
