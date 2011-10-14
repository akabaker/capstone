import ValidatePoint

def pathFind(start, end):
	if (ValidatePoint.validate(start) > 0 and ValidatePoint.validate(end) > 0):
		start = ValidatePoint.getPoint(start)
		start[5] = ValidatePoint.getChildren(start)
		return calcPath(start,end)
	else:
		if (ValidatePoint.validate(start) < 0):
			raise Exception("Cannot validate start point.")
		else:
			raise Exception("Cannot validate end point.")
			
def calcPath(start, end):
	start[3] = 0
	start[4] = ValidatePoint.calcDistance(start,end)
	start.append(0)
	curNode = start
	leaves = [curNode]
	while not ValidatePoint.isEqual(curNode, end):
		leaves.remove(curNode)
		curNode[5] = ValidatePoint.getChildren(curNode)
		for node in curNode[5]:
			node[3] = curNode[3] + ValidatePoint.calcDistance(node, curNode)
			node[4] = ValidatePoint.calcDistance(node, end)
			node.append(curNode)
			leaves.append(node)
		curNode = findLeastCost(leaves)
	return backwardTraverse(curNode, start)
	
def findLeastCost(list):
	node = list[0]
	for x in list:
		if node[3] + node[4] > x[3] + x[4]:
			node = x
	return node
	
def backwardTraverse(node, start):
	path = []
	while not node == start:
		n = [node[0], node[1], node[2]]
		path.insert(0,n)
		node = node[6]
	n = [start[0], start[1], start[2]]
	path.insert(0,n)
	return path
