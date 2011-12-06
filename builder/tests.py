from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.models import User
from django.utils import simplejson as json
from wayfinder.builder.models import Nodes
from wayfinder.builder.models import Paths
import random

class SimplePageTests(TestCase):
	"""Log into application and verify page status code"""
	fixtures = ['builder.json']

	def setUp(self):
		self.client = Client()
		self.user = User.objects.create_user('testuser', 'lol@lololol.net', 'test')
		self.user.is_staff = True
		self.client.login(username='testuser', password='test')

	def test_index(self):
		response = self.client.get('/builder/')	
		self.assertEqual(response.status_code, 200)
	
	def test_destlist(self):
		response = self.client.get('/destlist/')
		self.assertEqual(response.status_code, 200)

	def test_logout(self):
		response = self.client.get('/accounts/logout')
		self.assertEqual(response.status_code, 301)

class TestPathFinding(TestCase):
	"""Test path finding implementation

	map_bounds -- boundary of MU campus
	campus_coords -- coordinates of the center of campus

	Query the closest destinations from the starting position (radius 2 miles) and store the results.
	Then increment the map_bounds southwest coordinates until they are less than or equal to the northeest
	coords. For each iteration, a findpath query is performed, the time_to_find value is evaluated, ensuring
	that the findpath view returns a path in less than 5 seconds.

	"""
	fixtures = ['builder.json']

	def setUp(self):
		self.map_bounds = {'sw': (38.941116097466704, -92.33584062420618), 'ne': (38.94759137139376, -92.31609956585658)}
		self.campus_coords = (38.94617, -92.32866)

	def test_findpath(self):
		sw_lat = self.map_bounds['sw'][0]
		sw_lng = self.map_bounds['sw'][1]
		destinations = json.loads(self.client.get('/nearby/', {'lat': self.campus_coords[0], 'lng': self.campus_coords[1]}).content)
		destinations_len = len(destinations)
		print "Testing path finding \n"	
		while sw_lat <= self.map_bounds['ne'][0] and sw_lng < self.map_bounds['ne'][1]:
			sw_lat += .00005
			sw_lng += .00005
			random_index = random.randrange(0,destinations_len,1)
			dest = destinations[random_index]['label']
			response = self.client.post('/findpath/', {'start': '{0},{1}'.format(sw_lat,sw_lng), 'end': dest})
			path = json.loads(response.content)
			print "Start: {0},{1} Destination: {2} Distance: {3} RunTime: {4}".format(sw_lat,sw_lng,dest,path['distance'],path['time_to_find'])
			self.assertLessEqual(path['time_to_find'], 20.0)

class TestNodes(TestCase):
	"""Test CRUD functionality with Nodes model"""
	fixtures = ['builder.json']

	def setUp(self):
		"""Existing coordinates from fixture"""
		self.lat = 38.942627
		self.lng = -92.326564

	def test_create_node(self):
		node = Nodes.objects.create(lat=38.94617, lng=-92.32866)
		self.assertEqual(node.lat, 38.94617)
		self.assertEqual(node.lng, -92.32866)
	
	def test_read_node(self):
		node = Nodes.objects.get(lat=self.lat, lng=self.lng)
		self.assertEqual(node.lat, self.lat)
		self.assertEqual(node.lng, self.lng)
	
	def test_update_node(self):
		node = Nodes.objects.filter(lat=self.lat, lng=self.lng)
		d = {}
		d['label'] = 'Student Commons'
		node.update(**d)
		self.assertEqual(node[0].label, 'Student Commons')
	
	def test_delete_node(self):
		node = Nodes.objects.filter(lat=self.lat, lng=self.lng)
		node.delete()
		self.assertFalse(node)	

class TestPaths(TestCase):
	"""Test CRUD functionality with Paths model"""
	fixtures = ['builder.json']

	def setUp(self):
		"""Existing path from fixture"""
		self.node1_coords = {'lat': 38.946476, 'lng': -92.329217}
		self.node2_coords = {'lat': 38.946063, 'lng': -92.329260}
		self.node1 = Nodes.objects.create(lat=self.node1_coords['lat'], lng=self.node1_coords['lng'])	
		self.node2 = Nodes.objects.create(lat=self.node2_coords['lat'], lng=self.node2_coords['lng'])	

	def test_create_path(self):
		p = Paths(node1 = self.node1, node2 = self.node2)
		p.save()
		self.assertTrue(p)
	
	def test_read_path(self):
		node1 = Nodes.objects.all()[0]
		node2 = Nodes.objects.all()[1] 

		p = Paths.objects.filter(node1=node1,node2=node2)[0]
		self.assertEqual(p.node1, node1)
		self.assertEqual(p.node2, node2)
	
	def test_delete_path(self):
		p = Paths.objects.all()
		p.delete()
		self.assertFalse(p)
