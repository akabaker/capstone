/**
 * WayFinder
 */
var WayFinder = function() {
	var googleMap = Map();
	var map = googleMap.init();
	var markers = new google.maps.MVCArray;
	var paths = new google.maps.MVCArray;
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
	 * selectPairs
	 */
	function selectPairs() {
		google.maps.event.clearListeners(map);

		if (markers.getLength() < 2) {
			alert("Need at least 2 markers");
		} else {
			//var pair = new google.maps.MVCArray;
			var pair = [];
			markers.forEach(function(elem, index) {
				var marker = markers.getAt(index);
				google.maps.event.clearListeners(marker);

				google.maps.event.addListener(marker, "click", function() {
				google.maps.event.clearListeners(marker);
					marker.setDraggable(false);
					pair.push(marker.getPosition());
				
					if (pair.length === 2) {
						var segment = new google.maps.Polyline({
							path: pair,
							strokeColor: "#FF0000",
							strokeOpacity: 1.0,
							strokeWeight: 2
						});
						console.log(pair);

						segment.setMap(map);
						paths.push(segment);
						pair = [];
						paths.forEach(function(e, i) {
							console.log(e.getPath());
						});
					}
				});
			});
		}
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

		$("#toolbar-pairs").button({
			icons: { primary: "ui-icon-pencil" }
		}).click(selectPairs);

		$("#toolbar-save").button({
			icons: { primary: "ui-icon-bookmark" }
		}).click(saveMap);
	}

	function saveMap() {
		var data = prepareMarkers();

		$.ajax({
			type: "POST",
			url: "/savemap/",
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
			var label = typeof(elem.labelContent) != 'undefined' ? elem.labelContent : '';
			var lat = elem.getPosition().lat();
			var lng = elem.getPosition().lng();

			mapData.push({
				lat: lat,
				lng: lng,
				label: label,
			});
		});

		return mapData;
	}

	/**
	 * geoCode
	 * @param String latlng Reverse geocode based on latlng
	 */
	function geoCode(latlng) {
		var data = {};
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode({'location': latlng}, function(results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				data.results = results;
			}
		});
		return data;
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

	function destList() {
		$.ajax({
			type: "GET",
			url: "/destlist/",
			success: function(result) {
				$("#toolbar-destlist").append(result);
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
