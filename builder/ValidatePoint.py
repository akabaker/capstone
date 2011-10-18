from wayfinder.builder.models import Nodes, Paths
from django.db.models import Q
from numpy import sqrt

def validate(point):
	nodes = Nodes.objects.filter(lat__lt=point[0]+.005, lat__gt=point[0]-.005, lng__lt=point[1]+.005, lng__gt=point[1]-.005)
	if nodes:
		return 1
	return -1
	
def getPoint(point):
	p = [0,0,"",0,0,[]]
	notDefined = 1
	allNodes = Nodes.objects.filter(lat__lt=point[0]+.005, lat__gt=point[0]-.005, lng__lt=point[1]+.005, lng__gt=point[1]-.005)
	for node in allNodes:
		if notDefined:
			p[0] = node.lat
			p[1] = node.lng
			p[2] = node.label
			notDefined = 0
		elif calcDistance(p, [node.lat, node.lng]) < calcDistance(p, point):
			p[0] = node.lat
			p[1] = node.lng
			p[2] = node.label
	return p

def getChildren(point):
	nodes = Nodes.objects.get(lat=point[0],lng=point[1])
	if not nodes:
		return nodes
	paths = Paths.objects.filter(Q(node1=nodes)|Q(node2=nodes))
	otherNodes = []
	for path in paths:
		if path.node1 == nodes:
			otherNodes.append(path.node2)
		else:
			otherNodes.append(path.node1)
	points = []
	for node in otherNodes:
		p = [0,0,"",0,0,[]]
		p[0] = node.lat
		p[1] = node.lng
		p[2] = node.label
		points.append(p)
	return points
	
def isEqual(point1, point2):
	return point1[0] == point2[0] and point1[1] == point2[1]
	
def calcDistance(p1, p2):
	return sqrt( (p1[0]-p2[0]) * (p1[0]-p2[0]) + (p1[1]-p2[1]) * (p1[1]-p2[1]))
