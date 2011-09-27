from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Node(models.Model):
	lat = models.DecimalField(max_digits=16, decimal_places=14, unique=True)
	lng = models.DecimalField(max_digits=16, decimal_places=14, unique=True)
	label = models.CharField(max_length=100, null=True)
	zipcode = models.CharField(max_length=5, null=True)

	def __unicode__(self):
		return self.name
