from django.db import models
from django.contrib.auth.models import User

class NodesManager(models.Manager):
	def get_by_natural_key(self, lat, lng):
		return self.get(lat=lat, lng=lng)

class Nodes(models.Model):
	objects = NodesManager()

	#lat = models.FloatField()
	#lng = models.FloatField()
	lat = models.DecimalField(max_digits=16, decimal_places=14)
	lng = models.DecimalField(max_digits=16, decimal_places=14)
	label = models.CharField(max_length=100, null=True, unique=True)

	def __unicode__(self):
		return u'{0} {1}'.format(self.lat, self.lng)
	
	def natural_key(self):
		return (self.lat, self.lng)
	
	class Meta:
		unique_together = (('lat', 'lng'),)

class Paths(models.Model):
	node1 = models.ForeignKey(Nodes, related_name="node1")
	node2 = models.ForeignKey(Nodes, related_name="node2")

	class Meta:
		unique_together = (('node1', 'node2'),)
