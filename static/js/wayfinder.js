/**
 * WayFinder
 */
var WayFinder = function() {
	var googleMap = Map();
	var map = googleMap.init();
	var nodes = new google.maps.MVCArray;
	var paths = new google.maps.MVCArray;
	var markerOptions = {
		map: map,
		draggable: false,
		raiseOnDrag: false,
		labelAnchor: new google.maps.Point(20,0),
		labelClass: "labels",
		labelContent: ""
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
	 * createPath
	 * Create two node polyline
	 */
	function createPath() {
		var pair = new google.maps.MVCArray;
		google.maps.event.addListener(map, "click", function(event) {
			markerOptions.position = event.latLng,
        	marker = new MarkerWithLabel(markerOptions);

			google.maps.event.addListener(marker, "click", function() {
				console.log('clicked');
				pair.push(this);

				if (pair.getLength() === 2) {
					console.log('length is 2');
					$("#toolbar-path").button("enable");
					pathComplete();
				}
			});

        	nodes.push(marker);
        	pair.push(marker);
		
			if (pair.getLength() === 2) {
				$("#toolbar-path").button("enable");
				pathComplete();
			} else {
				$("#toolbar-path").button("disable");
			}

		});

		//nodes.forEach(function(elem, index) {
		//	checkMarker(elem);	
		//});

		// Path listeners
		google.maps.event.addListener(paths, "insert_at", function(index) {
			var path = paths.getAt(index);
			google.maps.event.addListener(path, "click", function(event) {
				path.setMap(null);
			});
		});

		// Check if marker was clicked as part of a path pair
		function checkMarker(marker) {
			google.maps.event.addListener(marker, "click", function() {
				pair.push(this);

				if (pair.getLength() === 2) {
					console.log('length is 2');
					$("#toolbar-path").button("enable");
					pathComplete();
				}
			});
		}
	
		// Check if the path is complete
		function pathComplete() {
			var path = [];
			for (var i = 0; i < pair.getLength(); i++) {
				path.push(pair.getAt(i).getPosition());
			}
			if (isPathEqual(path)) {
				console.log('path already placed');
			} else {
				var segment = new google.maps.Polyline({
					path: path,
					strokeColor: "#FF0000",
					strokeOpacity: 1.0,
					strokeWeight: 3
				});

				segment.setMap(map);
				paths.push(segment);

				pair.clear();
				//google.maps.event.clearListeners(map);
				//google.maps.event.clearListeners(marker);
				console.log("complete");
			}
		}
	}

	function isPathEqual(pair) {
		var returnCode = false

		var pathPair = [];
		paths.forEach(function(elem, index) {
			var path = elem.getPath();
			path.forEach(function(marker, index) {
				pathPair.push(marker);
			});
			
			if (pair == pathPair) {
				returnCode = true;
			} else {
				returnCode = false;	
			}
			pathPair = [];
		});
		return returnCode;
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

		$("#toolbar-path").button({
			icons: { primary: "ui-icon-pencil" }
		}).click(createPath);

		$("#toolbar-save").button({
			icons: { primary: "ui-icon-bookmark" }
		}).click(saveMap);
		
		$("#geocode-btn").button({ 
			icons: { primary: "ui-icon-search" } 
		}).click(function() {
			geoCode($("#geocode-address").val());
		});
	}

	function saveMap() {
		console.log(paths.getLength());
		//var data = prepareMarkers();
		/*
		$.ajax({
			type: "POST",
			url: "/savemap/",
			data: JSON.stringify(data),
			success: function(result) {
				console.log("from server");
				console.log(result);
			}
		});
		*/
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
