from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Map(models.Model):
	user = models.ForeignKey(User)
	name = models.CharField(max_length=50)	
	description = models.CharField(max_length=255)
	bounds_sw_lat = models.DecimalField(max_digits=16, decimal_places=14)
	bounds_sw_lng = models.DecimalField(max_digits=16, decimal_places=14)
	bounds_ne_lat = models.DecimalField(max_digits=16, decimal_places=14)
	bounds_ne_lng = models.DecimalField(max_digits=16, decimal_places=14)


class Node(models.Model):
	map = models.ForeignKey(Map, primary_key=True)
	lat = models.DecimalField(max_digits=16, decimal_places=14)
	lng = models.DecimalField(max_digits=16, decimal_places=14)
	label = models.CharField(max_length=255)
