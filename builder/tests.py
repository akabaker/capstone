from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.models import User
from wayfinder.builder.models import Nodes
from wayfinder.builder.models import Paths

class SimplePageTests(TestCase):
	fixtures = ['builder.json']

	def setUp(self):
		self.client = Client()
		self.user = User.objects.create_user('testuser', 'lol@lololol.net', 'test')
		self.user.is_staff = True
		self.client.login(username='testuser', password='test')

	def test_index(self):
		response = self.client.get('/builder/')	
		self.assertEqual(response.status_code, 200)
	
	def test_logout(self):
		response = self.client.get('/accounts/logout')
		self.assertEqual(response.status_code, 301)

class TestPathFinding(TestCase):
	fixtures = ['builder.json']

	def test_findpath(self):
		response = self.client.post('/findpath/', {'start': '38.94617,-92.32866', 'end': 'EBW'})
		self.assertEqual(response.status_code, 200)

class TestNodes(TestCase):
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
		pass
