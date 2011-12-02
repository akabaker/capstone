/**
 * WayFinder
 */
var WayFinder = function() {
	var googleMap = Map();
	var map = googleMap.init();
	var nodes = new google.maps.MVCArray;
	var paths = new google.maps.MVCArray;
	var pair = new google.maps.MVCArray;
	var startPoint = [];
	var testPaths = [];
	var wikiURL = "http://code.google.com/p/wayfinder/w/list";
	var polyLineOptions = {
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 3,
		clickable: false
	};
	var testPolylineOptions = {
		strokeColor: "#FFE303",
		strokeOpacity: 1.0,
		strokeWeight: 4,
		zIndex: 500,
		clickable: false
	};
	var markerOptions = {
		map: map,
		icon: "/static/images/pedestriancrossing.png",
		draggable: true,
		raiseOnDrag: false,
		animation: google.maps.Animation.DROP,
		labelAnchor: new google.maps.Point(20,0),
		labelClass: "labels",
		labelContent: "",
	};
	var previousPath;

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
	 * createLogWindow
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

		$.ajax({
			type: "POST",
			url: "/deletenode/",
			data: $.param(node),
			statusCode: {
				403: function() {
					$.jGrowl('Action not permitted');
				}
			},
			success: function(result) {
				$.jGrowl("Node deleted at " + node.coords);
				marker.setMap(null);
				//remove deleted marker and refresh marker clusterer
				window.wayfinderMc.removeMarker(marker);
				window.wayfinderMc.redraw();
				destList();
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
			data: $.param(node),
			statusCode: {
				403: function() {
					$.jGrowl("Action not permitted");
				}
			},
			success: function(result) {
				$.jGrowl("Node created at " + node.coords);
			}
		});
	}

	/**
	 * updateNode
	 * Update node label
	 */
	function updateNode(marker, label) {
		var node = prepNode(marker, label);

		$.ajax({
			type: "POST",
			url: "/updatenode/",
			data: $.param(node),
			statusCode: {
				403: function() {
					$.jGrowl("Action not permitted");
				},

				500: function() {
					$.jGrowl("Destination already exists");
					//marker.labelContent = "";
				}
			},
			success: function(result) {
				var results = JSON.parse(result);

				if (results.success) {
					$.jGrowl("Destination " + results.success + " saved");
					$("#editnode-dialog").dialog("close");
					marker.labelContent = results.success;
					marker.setMap(map);
					destList();
				} else {
					var form = $("#editnode-form");
					// Attach our error ul to the form
					var fields = form.find("input");
					for (var i = 0; i < fields.length; i++) {
						// If our form error list contains the same property (input name)
						// as the input list we found above, we need to attach an error notification
						// to that field
						if (results.errors.hasOwnProperty(fields[i].name)) {
							var name = fields[i].name;
							var tmplData = {
								message: results.errors[name]
							}

							// Find the input field that matches the current name
							var input = form.find("input[name="+name+"]");	
							var errorItem = "<div class='error-item'></div>";
						
							// If the current input has an error list after it, continue to the next item
							// else, add the errorItem div into the DOM and insert the error template
							if ($(".error-item").length) {
								continue;
							} else {
								$(input).after(errorItem);
								$(input).next().html($("#error-template").tmpl(tmplData));
							}
						}
					}
				}
			}
		});
	}

	/**
	 * prepNode
	 * Return object containing relevant node values
	 */
	function prepNode(marker, label) {
		//var label = typeof(marker.labelContent) != 'undefined' ? marker.labelContent : "";
		//var label = marker.labelContent;
		var label = label || marker.labelContent;
		var coords = marker.getPosition().toUrlValue(6);
		
		node = {
			coords: coords,	
			label: label
		}

		return node;
	}

	/**
	 * loadPaths
	 * Loads paths from database
	 */
	function loadPaths() {
		$("#toolbar-loading").show();

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

					polyLineOptions.path = path;
					var segment = new google.maps.Polyline(polyLineOptions);
					addPathToPaths(segment);
					segment.setMap(map);
				}

				$("#toolbar-loading").hide();
			}
		});
	}

	/**
	 * addPathToPaths
	 * @param Object path Object containing path
	 * Add path to paths array.
	 */
	function addPathToPaths(path) {
		paths.push(path);
	}

	/**
	 * createPath
	 * Save path to database
	 */
	function createPath(path) {
		var edge = prepPath(path);

		$.ajax({
			type: "POST",
			url: "/createpath/",
			data: $.param(edge),
			success: function(result) {
				$.jGrowl("Path created");
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

		var pathNode = {
			node1: node1.toUrlValue(6),
			node2: node2.toUrlValue(6),
		}
		return pathNode;
	}

	/**
	 * addMarkerListeners
	 */
	function addMarkerListeners(marker, toggle) {
		if (!toggle) {
			nodes.push(marker);
		}
		// Delete node
		google.maps.event.addListener(marker, "dragstart", function() {
			deleteNode(this);
		});

		// Add marker label
		google.maps.event.addListener(marker, "rightclick", function() {
			$("#editnode-dialog").dialog({
				modal: true,
				height: 200,
				resizable: false,
				width: 250,
				open: function() {
					$("#label").focus();
					$("#editnode-form").submit(function(event) {
						//prevent form submission
						event.preventDefault();
					});
				},

				buttons: {
					save: function() {
						var label = $("#label").val();
						updateNode(marker, label);
						$("#editnode-form").find("input").val("");
					}, 
					close: function() {
						//remove error messages from the DOM
						$(".error-item").detach();
						$(this).dialog("close");
					}
				}
			});
		});

		// Add to node to path
		google.maps.event.addListener(marker, "click", function() {
			pair.push(this);
			if (pair.getLength() === 2) {
				pathComplete();
			}
		});

		google.maps.event.addListener(marker, "mouseover", function() {
			this.setIcon("/static/images/pedestriancrossing_over.png");
		});

		google.maps.event.addListener(marker, "mouseout", function() {
			this.setIcon("/static/images/pedestriancrossing.png");
		});
	}

	/**
	 * loadNodes
	 * Query database and return all nodes. Uses the markerclusterer object to manage markers.
	 */
	function loadNodes() {
		var mcOptions = {gridSize: 75, maxZoom: 19};

		$.ajax({
			type: "GET",
			url: "/loadnodes/",
			success: function(result) {
				var nodes = JSON.parse(result);
				var nodesLength = nodes.length;
				var markers = [];

				if (nodesLength != 0) {
					for (var i = 0; i < nodesLength; i++) {
						var latLng = new google.maps.LatLng(nodes[i].fields.lat, nodes[i].fields.lng);
						markerOptions.position = latLng;

						if (nodes[i].fields.label == null) {
							markerOptions.labelContent = undefined;
						} else {
							markerOptions.labelContent = nodes[i].fields.label;
						}

						var marker = new MarkerWithLabel(markerOptions);
						markers.push(marker);
						// Set the label back to an emtpy string
						markerOptions.labelContent = "";
						// Place marker and re-add listeners
						startPath(marker, true);
					}

					//Initialize markerclusterer
					//var mc = new MarkerClusterer(map, markers, mcOptions);
					window.wayfinderMc = new MarkerClusterer(map, markers, mcOptions);

					$("#toolbar-markers").click(function() {
						if ($("#toolbar-markers").is(":checked")) {
							window.wayfinderMc.clearMarkers();	
						} else {
							window.wayfinderMc = new MarkerClusterer(map, markers, mcOptions);
						}
					});

				} else {
					$.jGrowl("No saved nodes, click on the map to being editing!");
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
			pair.push(marker);
			createNode(marker);
		
			if (pair.getLength() === 2) {
				pathComplete();
			} 
		}
	}

	/**
	 * pathComplete
	 * Checks if path is complete (two nodes placed). If the path is complete save to the database.
	 */
	function pathComplete() {
		var path = [];
		pair.forEach(function(elem, index) {
			path.push(elem.getPosition());
		});
		
		polyLineOptions.path = path;
		var segment = new google.maps.Polyline(polyLineOptions);

		if (isPathEqual(segment)) {
			console.log('paths equal');
			pair.clear();
		} else {
			segment.setMap(map);
			paths.push(segment);

			// Delay the DB write for a litte bit
			setTimeout(function() {
				createPath(segment);
			},500);
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
	 * django views. Executed on pageload
	 */
	(function modalForms() {
		/**
		 * Login modal form
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

	/**
	 * destList
	 * Populates the destination list. Appends the django templates to #toolbar-destlist
	 */
	function destList() {
		$.ajax({
			type: "GET",
			url: "/destlist/",
			success: function(result) {
				$("#toolbar-destlist").html(result).find("ul")
				.click(function() {
					var lat = $(this).find("li:nth-child(2)").text();
					var lng = $(this).find("li:nth-child(3)").text();
					var latlng = new google.maps.LatLng(lat, lng);
					map.panTo(latlng);
					map.setZoom(20);
				})
				.mouseover(function() {
					$(this).addClass("ui-state-active")
				})
				.mouseout(function() {
					$(this).removeClass("ui-state-active")
				});

			}
		});
	}

	/**
	 * clearMap
	 * Delete map paths and nodes, removes saved mapcenter and mapzoom values
	 */
	function clearMap() {
		$("#clearmap-dialog").dialog({
			modal: true,
			width: 500,
			resizable: false,	
			buttons: {
				Cancel: function() {
					$(this).dialog("close");
				}, 
				Delete: function() {
					$.ajax({
						type: "POST",
						url: "/clearmap/",
						success: function(result) {
							localStorage.removeItem('mapCenter');
							localStorage.removeItem('mapZoom');
							window.location = "/builder";
						}
					});
					$(this).dialog("close");
				}
			}
		});
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

		$("#toolbar-wiki").button();

		$("#toolbar-admin").button().click(function() {
			window.location = "/admin";
		});

		$("#toolbar-startpoint").button({
			icons: { primary: "ui-icon-flag" }
		})
		.click(function() {
			setStartPoint();
		});

		$("#toolbar-run").button();
		$("#toolbar-findpath").submit(function(event) {
			var data = $("#toolbar-findpath").serialize();
			
			$("#toolbar-loading").ajaxStart(function() {
				$(this).show();
			});

			$.ajax({
				type: "POST",
				url: "/findpath/",
				data: data,
				statusCode: {
					404: function(result) {
						alert(result);
					},
					500: function() {
						alert('Unable to find starting point');
						$("#toolbar-loading").ajaxStop(function() {
							$(this).hide();
						});
					}
				},
				success: function(result) {
					if (result.errors) {
						alert(result.errors);
					} else {
						var path = [];
						var resultLength = result.returned_path.length;
						for (var i = 0; i < resultLength; i++) {
							var latlng = new google.maps.LatLng(result.returned_path[i][0], result.returned_path[i][1]);
							path.push(latlng);
						}

						testPolylineOptions.path = path;
						var testPath = new google.maps.Polyline(testPolylineOptions);

						if (previousPath) {
							previousPath.setMap(null);
							previousPath = testPath;
						} else {
							previousPath = testPath;
						}

						testPath.setMap(map);
						
						var pathStats = {
							timeToFind: result.time_to_find,
							distance: result.distance,
							nodesCount: resultLength - 1,
							walkingTime: result.walking_time
						};

						$("#toolbar-pathstatslist").html($("#toolbar-pathstats").tmpl(pathStats));
						$("#toolbar-pathstatslist").effect("highlight", {}, 3000);

						$("#toolbar-loading").ajaxStop(function() {
							$(this).hide();
						});
					}
				}
			});
			return false;
		});

		$("#toolbar-paths").click(function() {
			if ($("#toolbar-paths").is(":checked")) {
				paths.forEach(function(elem, index) {
					elem.setMap(null);
				});
			} else {
				paths.forEach(function(elem, index) {
					elem.setMap(map);
				});
			}
		});

		$("#toolbar-useraccess").buttonset();

		$("#toolbar-edit").button();

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
	 * autoComplete
	 * jQuery UI autocomplete for test path
	 */
	(function autoComplete() {
		$("#end").autocomplete({
			source: "/labellist/",
			minLength: 1
		});
	})();

	/**
	 * setStartPoint
	 * set FindPath start point
	 */
	function setStartPoint() {
		if (startPoint.length == 0) {
			var marker = new StyledMarker({
							styleIcon: new StyledIcon(
                                StyledIconTypes.BUBBLE, {
                                        color: "00FF00",
                                        text: "Start"
                                }),
							position: map.getCenter(),
							animation: google.maps.Animation.DROP,
							map: map,
							draggable: true
						});

			startPoint.push(marker);
			$("#start").val(marker.getPosition().toUrlValue());
		} else {
			//$("#start").val(startPoint[0].getPosition().toUrlValue());
			map.panTo(startPoint[0].getPosition());
		}

		google.maps.event.addListener(startPoint[0], "dragend", function(event) {
			$("#start").val(this.getPosition().toUrlValue());
		});
	}

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
						$.jGrowl("Log in to edit map");
					}
				},
				success: function(result) {
					mapListeners();
					loadNodes();
					loadPaths();
					destList();
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

    	// Tooltips using the qtip library
    	// The target element is the next element after "elem". In this case, the next element will
    	// always be the "help" icon.
    	var tooltips = [
    		{
    			elem: $("#toolbar-clear"),
    			content: "Delete all nodes and paths.",
    			target: $("#toolbar-clear").prev()
			},
    		{
    			elem: $("#toolbar-startpoint"),
    			content: "Path finding test. Place and drag the start marker to the desired location, then type "
    			+ "in a destination and click run.",
    			target: $("#toolbar-startpoint").prev()
			},
    		{
    			elem: $("#toolbar-destlist"),
    			content: "Destination nodes list. Click a destination to set jump to that location on the map.",
    			target: $("#toolbar-destlist").prev()
			}
    	];

		for (var i = 0; i < tooltips.length; i++) {
			tooltips[i].target.qtip({
				content: tooltips[i].content,
				position: {
					my: "left center",
					at: "right center",
					target: tooltips[i].target
				},
				style: {
					classes: tooltips[i].classes || "ui-tooltip-red, ui-tooltip-rounded"
				}
			});
		}
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
	$.jGrowl.defaults.closer = false;

	if ( !$.browser.safari ) {
		$.jGrowl.defaults.animateOpen = {
			width: 'show'
		};
		$.jGrowl.defaults.animateClose = {
			width: 'hide'
		};
	}

	wayfinder = WayFinder();
	wayfinder.init();	
});
