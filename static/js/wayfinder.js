/**
 * WayFinder
 */
var WayFinder = function() {
	var googleMap = Map();
	var map = googleMap.init();
	var markers = new google.maps.MVCArray;
	var markerOptions = {
		map: map,
		//icon: "/static/images/vertex.png",
		draggable: true,
		raiseOnDrag: true,
		labelAnchor: new google.maps.Point(10,0),
		labelClass: "labels",
		labelContent: ""
	};

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
		google.maps.event.addListener(markers, "insert_at", addMarkerListeners);

		google.maps.event.addListener(markers, "set_at", function() {
			markers.forEach(function(elem, index) {
				console.log("index: " + index + " " + elem.getPosition().toString());
			});
		});
	}

	function addMarkerListeners() {
		google.maps.event.addListener(marker, "rightclick", function(event) {
			var clickedMarker = this;

			markers.forEach(function(elem, index) {
				if (clickedMarker === elem ) {
					markers.removeAt(index);
					clickedMarker.setMap(null);
				}
			});
		});

		google.maps.event.addListener(marker, "dragstart", function() {
			var startpos = this;

			google.maps.event.addListener(marker, "dragend", function() {
				markers.forEach(function(elem, index) {
					if (startpos === elem) {
						markers.setAt(index, elem);
					}
				});
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

		$("#toolbar-path").button({
			icons: { primary: "ui-icon-person" }
		}).click(addMarker);

		$("#toolbar-save").button({
			icons: { primary: "ui-icon-bookmark" }
		}).click(saveMap);
	}

	function saveMap() {
		polyline.getPath().forEach(function(vertex, index) {
			console.log(
				"dest: " + vertex.marker.labelContent + 
				" coords: " + vertex.marker.getPosition().lat() + 
				", " + vertex.marker.getPosition().lng()
			);
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
