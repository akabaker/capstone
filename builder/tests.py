"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.test.client import Client

class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)

class Simple(TestCase):
	def test_render(self):
		c = Client()
		response = c.get('/builder/')
		response.status_code
		self.assertEqual(response.status_code, 200)
