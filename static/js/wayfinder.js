/**
 * WayFinder
 */
var WayFinder = function() {

	function toolbar() {
		$("#toolbar-login").button({
			icons: { primary: "ui-icon-gear"}
		}).click(function() {
			$("#login-dialog").load("/accounts/login").dialog("open");
		});

		$("#toolbar-path").button({
			icons: { primary: "ui-icon-person" }
		}).click(function() {});
	}

	/**
	 * Create modal forms - the login and registration forms are from built-in 
	 * django views.
	 */
	function modalForms() {
		/**
		 * Create new map
		 */
		$("#newmap-dialog").dialog({
			autoOpen: false,
			height: 250,
			width: 350,
			modal: true,
			buttons: {
				close: function() {
					$(this).dialog('close')
				},

				create: function() {
					$.ajax({
						type: "POST",
						url: "/newmap/",
						data: $("#newmap-form").serialize(),
						success: function(data) {
						}
					});
				} 
			}
			
		});

		$("#toolbar-newmap").button({ icons: { primary: "ui-icon-gear"} }).click(function() {
			$("#newmap-dialog").dialog("open");
		});

		/**
		 * Login modal form
		 */
		$("#login-dialog").dialog({
			autoOpen: false,
			height: 250,
			width: 350,
			modal: true,
			buttons: {
				close: function() {
					$(this).dialog('close')
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

		$("#login").click(function() {
			$("#login-dialog").load("/accounts/login").dialog("open");
		});

		/**
		 * Registration form
		 */
		$("#register-dialog").dialog({
			autoOpen: false,
			height: 325,
			width: 800,
			modal: true,
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

		$("#register").click(function() {
			$("#register-dialog").load("/register/").dialog("open");
		});
	}

	function initialize() {
		var myMap = Map();
		var map = myMap.init();
		toolbar();
		modalForms();

		// Place CSRF header before any ajax request is sent
		$.ajaxSetup({
			beforeSend: function(xhr, settings) {
				if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
					// Only send the token to relative URLs i.e. locally.
					xhr.setRequestHeader("X-CSRFToken",
										$("#csrfmiddlewaretoken").val());
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
