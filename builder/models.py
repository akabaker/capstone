from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Nodes(models.Model):
	#lat = models.DecimalField(max_digits=16, decimal_places=14, unique=True)
	#lng = models.DecimalField(max_digits=16, decimal_places=14, unique=True)
	#lat = models.DecimalField(max_digits=16, decimal_places=14)
	#lng = models.DecimalField(max_digits=16, decimal_places=14)
	lat = models.FloatField()
	lng = models.FloatField()
	label = models.CharField(max_length=100, null=True, unique=True)

	def __unicode__(self):
		return u'{0} {1}'.format(self.lat, self.lng)

class Paths(models.Model):
	node1 = models.ForeignKey(Nodes, related_name="node1")
	node2 = models.ForeignKey(Nodes, related_name="node2")
