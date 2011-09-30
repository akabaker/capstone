from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.conf import settings
from django.contrib.auth import SESSION_KEY, BACKEND_SESSION_KEY, load_backend
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import AnonymousUser
from django.core import serializers
from wayfinder.builder.models import Nodes, Paths
from decimal import Decimal
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

# Must render template with the correct RequestContext for access to user auth data
def builder(request):
	return render_to_response('builder.html', context_instance=RequestContext(request))

def load_nodes(request):
	jsondata = serializers.serialize('json', Nodes.objects.all(), fields=('lat','lng','label'))
	return HttpResponse(json.dumps(jsondata), mimetype='application/json')

@csrf_exempt
def update_node(request):
	node = json.loads(request.raw_post_data)
	n = Nodes.objects.filter(lat=node.get('lat'), lng=node.get('lng'))

	if not n:
		n = Nodes(
			lat = node.get('lat'),
			lng = node.get('lng'),
			label = node.get('label'),
		)
		n.save()
		return HttpResponse('node created')

	else:
		d = {}
		d['label'] = node.get('label')
		# Update model with kwargs expansion
		n.update(**d)

	return HttpResponse('node updated')

@csrf_exempt
def delete_node(request):
	node = json.loads(request.raw_post_data)
	n = Nodes.objects.filter(lat=node.get('lat'), lng=node.get('lng'))
	n.delete()
	return HttpResponse('node deleted')

@csrf_exempt
def clear_map(request):
	p = Paths.objects.all()
	p.delete()
	n = Nodes.objects.all()
	n.delete()

	return HttpResponse('map cleared')

@csrf_exempt
def create_node(request):
	node = json.loads(request.raw_post_data)

	label = node.get('label')
	if label == "":
		label = None

	n = Nodes(
		lat = node.get('lat'),
		lng = node.get('lng'),
		label = label,
	)

	n.save()

	return HttpResponse('node created')

@csrf_exempt
def create_path(request):
	import decimal
	path = json.loads(request.raw_post_data)
	#node1 = Nodes.objects.filter(lat=pathNode1[0], lng=pathNode1[1])	
	#node2 = Nodes.objects.filter(lat=pathNode2[0], lng=pathNode2[1])	

	return HttpResponse(path)

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
