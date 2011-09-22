/**
 * WayFinder
 */
var WayFinder = function() {
	var googleMap = Map();
	var map = googleMap.init();
	var polyline;

	// Global override for polyline marker image path
	google.maps.Polyline.prototype.edit.settings.imagePath = "/static/images/" 

	/**
	 * placePath
	 * Generates initial polyline path
	 */
	function placePath() {
		var mapCenter = map.getCenter();
		var counter = 0.0005;
		var initialPath = [];

		for (var i = 0; i < 2; i++) {
			if (counter == 0.0005) {
				//initialPath.push(add(mapCenter, counter));
				initialPath.push(mapCenter);
				counter += counter + 0.0001;
			} else {
				var prev = i - 1;
				initialPath.push(add(initialPath[prev], counter));
			}
		}

		// Initialize polyline in center of map with offset points
		polyline = new google.maps.Polyline({
			map: map,
			path: initialPath,
		});

		polyline.edit();

		// Add listener to marker if marker is moved
		google.maps.event.addListener(polyline, 'update_at', function(index, position) {
			addTitle(position);
		});

		// Add listener to marker if marker is created
		google.maps.event.addListener(polyline, 'insert_at', function(index, position) {
			addTitle(position);
		});
		
		$("#toolbar-path").button({ disabled: true });
	}

	/**
	 * addTitle
	 * Label the marker as a destination
	 * @param Object position Event object
	 */
	function addTitle(position) {
		google.maps.event.addListener(position.marker, "click", function(e) {
			var title = prompt("title please");
			position.marker.labelContent = title;
			position.marker.setMap(map);
		});
	}

	/**
	 * add
	 * @param Object point LatLng object
	 * @param Float offset Value to add to latlng
	 * @return LatLng
	 */
	function add(point, offset) {
		var lat = parseFloat(point.lat() + offset);
		var lng = parseFloat(point.lng() + offset);
		var latlng = new google.maps.LatLng(lat, lng);
		return latlng;
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
			icons: { primary: "ui-icon-person" }
		}).click(placePath);

		$("#toolbar-save").button({
			icons: { primary: "ui-icon-bookmark" }
		});
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
