"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.test.client import Client

class PageResponseCode(TestCase):
	def test_builder(self):
		response = self.client.get('/builder/')	
		self.assertEqual(response.status_code, 200)
