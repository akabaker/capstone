capstone
========

A web/mobile application used to find shortest paths for pedestrians.

Quick start guide to using Wayfinder.

Wayfinder requires connected nodes and paths in order to provide a path from a particular location to a destination.

**Step 1 - Nodes**

A marker on the map can be considered a node. The main purpose of a node is to mark waypoints between paths. Nodes contain the latitude and longitude of its position and can contain a label.

*Creating Nodes*
  * Click on the map to create a node.

*Labeling Nodes (create destination)*
  # Right click on node.
  # Type in a destination label.
    * Labels are unique; there cannot be two nodes with the same label.

*Deleting Nodes*
  * Click and drag on the node you wish to delete.
    * Note, this will delete any connected paths.

**Step 2 - Paths**

Paths are two nodes that are members of an array. Path arrays have a length of two. Paths are represented on Google Maps with a polyline connecting the nodes. Two successive clicks on the map will always create a new path.

*Creating Paths*
  * Click on the map to place a node. Click on the map again to complete this path.
  * "Branching" paths can be created by clicking on already placed nodes.

*Deleting Paths*
  * Deleting paths requires that you delete the nodes associated with that path. Deleting a single node from a path will remove the path. Refresh the page to redraw the map. 

**Step 3 - Test Path Finding**

You can test path finding by using the 'test path finding' widget located on the middle left side of the screen. Results will appear after the path has been rendered on the map.

  * Click on "Place Start", this simulates the user's starting position.
  * Select the "End" input field. Start typing in the name of a destination (destination names can be found in the Destinations list).
  * Click on "Run". This will render the optimal path as a yellow polyline on the map.

You can drag the "start" marker around the screen to test different starting positions (as well as different destinations).