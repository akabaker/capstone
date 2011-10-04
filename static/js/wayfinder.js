/**
 * WayFinder
 */
var WayFinder = function() {
	var googleMap = Map();
	var map = googleMap.init();
	var nodes = new google.maps.MVCArray;
	var paths = new google.maps.MVCArray;
	var pair = new google.maps.MVCArray;
	var markerOptions = {
		map: map,
		draggable: true,
		raiseOnDrag: false,
		labelAnchor: new google.maps.Point(20,0),
		labelClass: "labels",
		labelContent: "",
	};

	/**
	 * geoCode
	 * @param String latlng Reverse geocode based on latlng
	 */
	function geoCode(address) {
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode({'address': address}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				map.setCenter(results[0].geometry.location);
			}
		});
	}

	/**
	 * createLogWindw
	 * Create log-display if it doesn't exist
	 */
	function createLogWindow() {
		if ($("#log-display").length == 0) {
			$("header h1").after("<div id='log-display'></div>");
			$("#log-display").addClass("ui-corner-all log-display-rules");
		}
	}

	/**
	 * deleteNode
	 * Delete node from database
	 */
	function deleteNode(marker) {
		node = prepNode(marker);
		createLogWindow();

		$.ajax({
			type: "POST",
			url: "/deletenode/",
			//data: JSON.stringify(node),
			data: $.param(node),
			statusCode: {
				403: function() {
					$("#log-display").html("<span>Action not permitted</span>");
				}
			},
			success: function(result) {
				$("#log-display").html("<span>Node deleted at " + node.coords + "</span>");
				marker.setMap(null);
			}
		});
	}

	/**
	 * createNode
	 * Save node object to database
	 */
	function createNode(marker) {
		node = prepNode(marker);

		$.ajax({
			type: "POST",
			url: "/createnode/",
			//data: JSON.stringify(node),
			data: $.param(node),
			success: function(result) {
				createLogWindow();
				$("#log-display").html("<span>Node created at " + node.coords + "</span>");
			}
		});
	}

	/**
	 * updateNode
	 * Update node label
	 */
	function updateNode(marker) {
		var node = prepNode(marker);

		$.ajax({
			type: "POST",
			url: "/updatenode/",
			//data: JSON.stringify(node),
			data: $.param(node),
			success: function(result) {
				marker.setMap(map);
				$("#log-display").html("<span>Destination " + node.label + " saved" +"</span>").fadeIn("slow");
			}
		});
	}

	/**
	 * prepNode
	 * Return object containing relevant node values
	 */
	function prepNode(marker) {
		var label = typeof(marker.labelContent) != 'undefined' ? marker.labelContent : "";
		var coords = marker.getPosition().toUrlValue(6);
		//var lat = marker.getPosition().lat();
		//var lng = marker.getPosition().lng();
		
		node = {
			coords: coords,	
			label: label
		}

		return node;

		/*
		node = {
			lat: lat,
			lng: lng,
			label: label
		}

		return node;
		*/
	}

	/**
	 * loadPaths
	 * Loads paths from database
	 */
	function loadPaths() {
		$.ajax({
			type: "GET",
			url: "/loadpaths/",
			success: function(result) {
				var paths = JSON.parse(result);
				var pathsLength = paths.length;
				for (var i = 0; i < pathsLength; i++) {

					var path = [];
					path.push(new google.maps.LatLng(paths[i].fields.node1[0], paths[i].fields.node1[1]));
					path.push(new google.maps.LatLng(paths[i].fields.node2[0], paths[i].fields.node2[1]));

					var segment = new google.maps.Polyline({
						path: path,
						strokeColor: "#FF0000",
						strokeOpacity: 1.0,
						strokeWeight: 3
					});

					segment.setMap(map);
					//addPathListeners(segment);
				}
			}
		});
	}

	/**
	 * createPath
	 * Send edge to database
	 */
	function createPath(path) {
		var edge = prepPath(path);
		//console.log(JSON.stringify(edge));	
		//
		$.ajax({
			type: "POST",
			url: "/createpath/",
			//data: JSON.stringify(edge),
			data: $.param(edge),
			success: function(result) {
				console.log(result);
			}
		});
	}

	/**
	 * prepPath
	 * Create object to stringfy and save to database
	 * @return object containing node1 and node2 lat/lng
	 */
	function prepPath(path) {
		var mapPath = path.getPath();
		var node1 = mapPath.getAt(0);
		var node2 = mapPath.getAt(1);

		//var lat = marker.getPosition().lat();
		/*
		var pathNode = {
			node1: [
				node1.lat(),
				node1.lng()
			],

			node2: [
				node2.lat(),
				node2.lng()
			]
		};
		*/

		var pathNode = {
			node1: node1.toUrlValue(6),
			node2: node2.toUrlValue(6),
		}
		return pathNode;
	}

	/**
	 * addMarkerListeners
	 */
	function addMarkerListeners(marker) {
		// Delete node
		google.maps.event.addListener(marker, "dragstart", function() {
			deleteNode(this);
		});

		// Add marker label
		google.maps.event.addListener(marker, "rightclick", function() {
			var label = prompt("Enter a location name");
			marker.labelContent = label;
			updateNode(marker);
		});

		// Add to node to path
		google.maps.event.addListener(marker, "click", function() {
			console.log('pathcreate fired');
			pair.push(this);

			if (pair.getLength() === 2) {
				pathComplete();
			}
		});
	}

	/**
	 * addPathListeners
	 */
	function addPathListeners(path) {
		/*
		google.maps.event.addListener(path, "rightclick", function() {
			var path = prepPath(this);
			deletePath(path);
		});

		// Delete path
		google.maps.event.addListener(path, "remove_at", function() {
			console.log('fired');
			this.setMap(null);
		});
		*/
	}

	/**
	 * deletePath
	 * Delete path
	 */
	function deletePath(path) {
		var pathNodes = JSON.stringify(path);	

		$.ajax({
			type: "POST",
			url: "/deletepath/",
			data: pathNodes,
			success: function(result) {
				console.log(result);
			}
		});
	}

	/**
	 * loadNodes
	 * Query database and return all nodes
	 */
	function loadNodes() {
		$.ajax({
			type: "GET",
			url: "/loadnodes/",
			success: function(result) {
				var nodes = JSON.parse(result);
				var nodesLength = nodes.length;

				if (nodesLength != 0) {
					for (var i = 0; i < nodesLength; i++) {
						var latLng = new google.maps.LatLng(nodes[i].fields.lat, nodes[i].fields.lng);
						markerOptions.position = latLng;

						var marker = new MarkerWithLabel(markerOptions);
						marker.labelContent = nodes[i].fields.label;

						// Place marker and re-add listeners
						startPath(marker, true);
					}
				} else {
					console.log('no previous nodes');
				}
			}
		});
	}

	/**
	 * mapListeners
	 */
	function mapListeners() {
		google.maps.event.addListener(map, "click", function(event) {
			markerOptions.position = event.latLng;
        	var marker = new MarkerWithLabel(markerOptions);
			startPath(marker, false);
		});
	}

	/**
	 * startPath
	 * Create two node polyline
	 */
	function startPath(marker, isLoadedMarker) {
		// Add listeners
		addMarkerListeners(marker);

		// If marker is new
		if (!isLoadedMarker) {
			//nodes.push(marker);
			pair.push(marker);
			createNode(marker);
		
			if (pair.getLength() === 2) {
				pathComplete();
			} 
		}
	}

	/**
	 * pathComplete
	 * Checks if path is complete (two nodes placed)
	 */
	function pathComplete() {
		var path = [];
		pair.forEach(function(elem, index) {
			path.push(elem.getPosition());
		});

		var segment = new google.maps.Polyline({
			path: path,
			strokeColor: "#FF0000",
			strokeOpacity: 1.0,
			strokeWeight: 3
		});

		if (isPathEqual(segment)) {
			console.log('paths equal');
			pair.clear();
		} else {
			segment.setMap(map);

			// Delay the DB write for a litte bit
			setTimeout(function() {
				createPath(segment);
			},500);
			//addPathListeners(segment);
			pair.clear();
		}
	}

	/**
	 * isPathEqual
	 * For each path in paths, check to see if the current path (the one being placed) is already in paths
	 */
	function isPathEqual(path) {
		var returnCode = false
		paths.forEach(function(elem, index) {
			console.log(index);

			//TODO make this less wtf
			if (elem.getPath().getAt(0).equals(path.getPath().getAt(0)) && elem.getPath().getAt(1).equals(path.getPath().getAt(1)) ||
				elem.getPath().getAt(1).equals(path.getPath().getAt(0)) && elem.getPath().getAt(0).equals(path.getPath().getAt(1))) {
				returnCode = true;
			} else {
				returnCode = false;
			}
		});
		return returnCode;
	}

	/**
	 * Create modal forms - the login and registration forms are from built-in 
	 * django views.
	 */
	(function modalForms() {
		/**
		 * Login modal form
		 *
		 * The open function sets up the focus and keypress listeners for great success.
		 */
		$("#login-dialog").dialog({
			autoOpen: false,
			height: 250,
			width: 350,
			modal: true,
			open: function() {
				$("#login-dialog").load("/accounts/login/", function() {
					$("#id_username").focus();
					$(this).find("input").keypress(function(event) {
						if (event.which == 13) {
							event.preventDefault();
							$("#login-dialog").dialog("option").buttons.login();
						}
					});
				});
			},

			buttons: {
				close: function() {
					$(this).dialog("close");
				},

				login: function() {
					$.ajax({
						type: "POST",
						url: "/accounts/login/",
						data: $("#login-form").serialize(),
						success: function(data) {
							var errors = $(data).find("#login-error").val();
							if (errors) {
								$("#error-message").replaceWith("<p class='error'>" + "Your username and password didn't match" + "</p>");
							} else {
								window.location = "/builder";
							}
						}
					});
				} 
			}
		});

		/**
		 * Registration form
		 */
		$("#register-dialog").dialog({
			autoOpen: false,
			height: 325,
			width: 800,
			modal: true,
			open: function() {
				$("#register-dialog").load("/register/", function() {
					$("#id_username").focus();
					$(this).find("input").keypress(function(event) {
						if (event.which == 13) {
							event.preventDefault();
							$("#register-dialog").dialog("option").buttons.create();
						}
					});
				});
			},

			buttons: {
				close: function() {
					$(this).dialog('close')
				},
				create: function() {
					$.ajax({
						type: "POST",
						url: "/register/",
						data: $("#registration-form").serialize(),
						success: function(data) {
							// Check and see if any errors are present
							var html = $(data).find(".errorlist");
							// If there are errors present, rebuild the dialog with the output from view
							if (html) {
								$("#register-dialog").html(data);
							} else {
								window.location = "/builder";
							}
						}
					});
				} 
			}
		});
	})();

	function destList() {
		$.ajax({
			type: "GET",
			url: "/destlist/",
			success: function(result) {
				$("#toolbar-destlist").append(result);
			}
		});
	}

	function clearMap() {
		var clearOk = confirm("Are you sure?");

		if (clearOk) {
			$.ajax({
				type: "POST",
				url: "/clearmap/",
				success: function(result) {
					window.location = "/builder";
				}
			});
		}
	}

	(function toolbar() {
		//Login message, oh jquery you bastard
		$("#toolbar-buttons").find("p").first().hide().fadeIn("slow");

		$("#toolbar-login").button().click(function() {
			$("#login-dialog").load("/accounts/login/").dialog("open");
		});

		$("#toolbar-logout").button().click(function() {
			window.location = "/accounts/logout/";
		});

		$("#toolbar-register").button().click(function() {
			$("#register-dialog").load("/register/").dialog("open");
		});

		$("#toolbar-admin").button().click(function() {
			window.location = "/admin";
		});
		
		$("#toolbar-useraccess").buttonset();

		$("#toolbar-clear").button({
			icons: { primary: "ui-icon-bookmark" }
		}).click(clearMap);

		$("#geocode-btn").button({ 
			icons: { primary: "ui-icon-search" } 
		}).click(function() {
			geoCode($("#geocode-address").val());
		});
	})();

	/**
	 * initialize
	 * Bring everything together
	 */
	function initialize() {

		// Check if user is authenticated and has permissions to edit the map
		(function checkAuth() {
			$.ajax({
				type: "GET",
				url: "/userauth/",
				statusCode: {
					403: function() {
						createLogWindow();
						$("#log-display").html("<span>Log in to edit map</span>");
					}
				},
				success: function(result) {
					mapListeners();
					loadNodes();
					loadPaths();
				}
			});
		})();

		// Place CSRF header before any ajax request is sent, required for django POST (unless view is csrf_exempt)
		$.ajaxSetup({
			beforeSend: function(xhr, settings) {
				if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
					// Only send the token to relative URLs i.e. locally.
					xhr.setRequestHeader("X-CSRFToken", $("#csrfmiddlewaretoken").val());
				}
			}
    	});
	}

	/**
	 * Public methods
	 */
	return {
		init: function() {
			initialize();
		}
	};
};

/**
 * Execute on window ready
 */
$(function() {
	wayfinder = WayFinder();
	wayfinder.init();	
});
