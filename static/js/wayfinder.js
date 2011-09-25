/**
 * WayFinder
 */
var WayFinder = function() {
	var googleMap = Map();
	var map = googleMap.init();
	var markers = new google.maps.MVCArray;
	var saveMapURI = "/savemap/";
	var markerOptions = {
		map: map,
		draggable: true,
		raiseOnDrag: true,
		labelAnchor: new google.maps.Point(20,0),
		labelClass: "labels",
		labelContent: ""
	};
	// Check if point is within map bounds
	function isInBounds(point) {
		if (point >= bounds.sw && point <= bounds.nw) {
			console.log("point in bounds");
		}
	}

	function getMapBounds() {
		var bounds = {
			sw: [ 
				map.getBounds().getSouthWest().lat(),
				map.getBounds().getSouthWest().lng(),
			],
			ne: [ 
				map.getBounds().getNorthEast().lat(),
				map.getBounds().getNorthEast().lng(),
			]
		};

		return bounds;
	}

	function getMapCenter() {
		var center = [
			map.getBounds().getCenter().lat(),
			map.getBounds().getCenter().lng(),
		];

		return center;
	}

	/**
	 * addMarker
	 */
	function addMarker() {
		google.maps.event.clearListeners(map);
		google.maps.event.addListener(map, "click", function(event) {
			markerOptions.position = event.latLng,

        	marker = new MarkerWithLabel(markerOptions);

			markers.push(marker);
		});

		// Add listeners for each marker every time a new marker is inserted into markers
		google.maps.event.addListener(markers, "insert_at", function(index){
			addMarkerListeners(index);
		});

		google.maps.event.addListener(markers, "set_at", function() {
			markers.forEach(function(elem, index) {
				console.log("index: " + index + " " + elem.getPosition().toString());
			});
		});
	
		$("#toolbar-marker").button({ disabled: "true" });
	}

	/**
	 * addMarkerListeners
	 * @param Number index Index of selected marker in markers
	 */
	function addMarkerListeners(index) {
		// Get newly added marker from the markers array and attach listeners to it
		var marker = markers.getAt(index);

		// Add marker label (destination)
		google.maps.event.addListener(marker, "click", function() {
			var name = prompt("Set label");
			marker.labelContent = name;
			marker.setMap(map);
		});

		// Marker right click (delete)
		google.maps.event.addListener(marker, "rightclick", function() {
			var clickedMarker = this;

			markers.forEach(function(elem, index) {
				if (clickedMarker === elem ) {
					markers.removeAt(index);
					clickedMarker.setMap(null);
				}
			});
		});

		// Marker drag (update position in the markers array)
		google.maps.event.addListener(marker, "dragstart", function() {
			var startpos = marker;

			google.maps.event.addListener(marker, "dragend", function() {
				startpos.setPosition(marker.getPosition());
			});
		});
	}

	function toolbar() {
		//Log in message, oh jquery you bastard
		$("#toolbar-buttons").find("p").first().hide().fadeIn("slow");

		$("#toolbar-login").button().click(function() {
			$("#login-dialog").load("/accounts/login/").dialog("open");
		});

		$("#toolbar-logout").button().click(function() {
			window.location = "/accounts/logout/";
		});

		$("#toolbar-newmap").button().click(function() {
			$("#newmap-dialog").dialog("open");
		});

		$("#toolbar-register").button().click(function() {
			$("#register-dialog").load("/register/").dialog("open");
		});

		$("#toolbar-admin").button().click(function() {
			window.location = "/admin";
		});
		
		$("#toolbar-useraccess").buttonset();

		$("#toolbar-marker").button({
			icons: { primary: "ui-icon-person" }
		}).click(addMarker);

		$("#toolbar-save").button({
			icons: { primary: "ui-icon-bookmark" }
		}).click(saveMap);
	}

	function saveMap() {
		var data = prepareMarkers();

		$.ajax({
			type: "POST",
			url: saveMapURI,
			data: JSON.stringify(data),
			success: function(result) {
				console.log("from server");
				console.log(result);
			}
		});
	}

	function prepareMarkers() {
		var mapData = [];

		// All we need from our markers list is the coordinates of the marker and title if it has one
		markers.forEach(function(elem, index) {
			mapData.push({
				lat: elem.getPosition().lat(),
				lng: elem.getPosition().lng(),
				name: elem.labelContent
			});
		});

		return mapData;
	}

	function logCoords(elem) {
		console.log(
			"dest: " + elem.getTitle() + 
			" coords: " + elem.getPosition().toString()
		);
	}

	/**
	 * Create modal forms - the login and registration forms are from built-in 
	 * django views.
	 */
	function modalForms() {
		// Create new map dialog
		$("#newmap-dialog").dialog({
			autoOpen: false,
			height: 250,
			width: 350,
			modal: true,
			open: function() {
				$("#newmap-dialog").load("/newmap/", function() {
					$("#id_name").focus();
					$(this).find("input").keypress(function(event) {
						if (event.which == 13) {
							event.preventDefault();
							$("#newmap-dialog").dialog("option").buttons.create();
						}
					});
				});
			},

			buttons: {
				close: function() {
					$(this).dialog("close");
				},

				create: function() {
					var bounds = getMapBounds();

					var bounds_sw_lat = $("#newmap-form").find(":hidden[name='bounds_sw_lat']").val(bounds.sw[0]);
					var bounds_sw_lng = $("#newmap-form").find(":hidden[name='bounds_sw_lng']").val(bounds.sw[1]);
					var bounds_ne_lat = $("#newmap-form").find(":hidden[name='bounds_ne_lat']").val(bounds.ne[0]);
					var bounds_ne_lng = $("#newmap-form").find(":hidden[name='bounds_ne_lng']").val(bounds.ne[1]);

					//$(bounds_ne).val(bounds.ne);

					$.ajax({
						type: "POST",
						url: "/newmap/",
						data: $("#newmap-form").serialize(),
						success: function(result) {
							// Check and see if any errors are present
							var html = $(result).find(".errorlist");
							// If there are errors present, rebuild the dialog with the output from view
							if (html) {
								$("#newmap-dialog").html(result);
							} else {
								window.location = "/builder";
							}
						}
						
					});
				}
			}
		});

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
	}


	/**
	 * initialize
	 * Bring everything together
	 */
	function initialize() {
		toolbar();
		modalForms();

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
