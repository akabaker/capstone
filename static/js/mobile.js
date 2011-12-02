/**
 * WayFinderMobile
 */
var WayFinderMobile = function() {
	var testPolylineOptions = {
		strokeColor: "#FFE303",
		strokeOpacity: 1.0,
		strokeWeight: 4,
		zIndex: 500,
		clickable: false
	};
	var markerOptions = {
		icon: "/static/images/pedestriancrossing.png",
	};

	var map = null,
		dest = null,
		previousMarker;

	/** Converts numeric degrees to radians
	 * Taken from http://www.movable-type.co.uk/scripts/latlong.html
	 */
	if (typeof(Number.prototype.toRad) === "undefined") {
		Number.prototype.toRad = function() {
			return this * Math.PI / 180;
		}
	}

	/**
	 * addOptions
	 * @param select
	 * @param elem
	 * Helper to add select option to an existing select menu
	 */
	function addOption(select, elem, index) {
		var valueString = elem.lat + "," + elem.lng;
		var optionValue = select.id === "mobile-start" ? valueString : elem.label;
		var optionText = elem.label;
		var optionString = "<option " + "value='" + optionValue + "'>" + optionText + "</option>";
		return optionString;
	}

	/**
	 * route
	 * @param String start Lat and lng of the starting position.
	 * Performs ajax call to findpath.
	 */
	function route(start) {
		var params = {
			csrfmiddlewaretoken: $("#csrfmiddlewaretoken").val(),
			start: start,
			end: $("#mobile-end").val()
		}

		//urlencode data object
		var data = $.param(params);

		//Ajax loading
		$.mobile.showPageLoadingMsg();

		$.ajax({
			type: "POST",
			url: "/findpath/",
			data: data,
			statusCode: {
				404: function(result) {
					$.mobile.hidePageLoadingMsg();
					alert(result);
				},
				500: function() {
					$.mobile.hidePageLoadingMsg();
					alert('Server returned HTTP 500, use Firebug or Chrome JavaScript console for more info.');
				}
			},
			success: function(result) {
				var path = [];
				var resultLength = result.returned_path.length;
				for (var i = 0; i < resultLength; i++) {
					var latlng = new google.maps.LatLng(result.returned_path[i][0], result.returned_path[i][1]);
					path.push(latlng);
				}

				testPolylineOptions.path = path;
				var testPath = new google.maps.Polyline(testPolylineOptions);

				//Center map on the starting node..
				var centerLatLng = new google.maps.LatLng(result.returned_path[0][0], result.returned_path[0][1]);
				map.setCenter(centerLatLng);
				testPath.setMap(map);

				dest = result.returned_path.pop();

				//Array of objects containing markerOptions for start/stop positions on the map
				var routeMarkers = [{text: "Start", color: "00FF00", pos: path[0]},{text: "Stop", color: "FF0000", pos: path[path.length - 1]}];
				for (var i = 0; i < routeMarkers.length; i++) {
					var marker = new StyledMarker({
									styleIcon: new StyledIcon(
										StyledIconTypes.BUBBLE, {
												color: routeMarkers[i].color,
												text: routeMarkers[i].text,
										}),
									position: routeMarkers[i].pos,
									animation: google.maps.Animation.DROP,
									map: map,
									draggable: false
								});

					//Fire resize event to size the map to the current viewport
					google.maps.event.trigger(map, "resize");
				}

				//Messy, but appends route travel data to DOM
				$("#route-details").html("<div>Distance: " + result.distance 
				+ " miles</div>" + "<div>Time: " + result.walking_time + " minutes</div>");

				//Hide ajax loading message
				$.mobile.hidePageLoadingMsg();
			}
		});
	}

	/**
	 * haversine
	 * @param {Number} points: Lat/lng values
	 */
	function haversine(lon1, lat1, lon2, lat2) {
		var R = 3961; // miles
		var dLat = (lat2-lat1).toRad();
		var dLon = (lon2-lon1).toRad();
		var lat1 = lat1.toRad();
		var lat2 = lat2.toRad();

		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
				Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var distance = R * c;
		return distance
	}

	return {
		/**
		 * initialize
		 * @param {Object} position: Navigator geolocation object
		 * @param {Boolean} geo: Flag for hardware support of geolocation
		 * Create the map
		 */
		initialize: function(position) {
			var latlng = new google.maps.LatLng(
				//position.coords.latitude,
				//position.coords.longitude
				position.lat,
				position.lng
			);

			var myOptions = {
				zoom: 17,
				center: latlng,
				mapTypeId: google.maps.MapTypeId.SATELLITE
			};

			map = new google.maps.Map(document.getElementById("map_canvas"),myOptions);

			/*
			 * If the start position is set to something besides "Current Position", use that value.
			 * Otherwise, use the lat and lng provided by the GPS device.
			 */
			var start;
			if ($("#mobile-start").val()) {
				start = $("#mobile-start").val();
				route(start);
			} else {
				//start = position.coords.latitude + "," + position.coords.longitude;
				start = position.lat + "," + position.lng;
				route(start);
			}
		},

		getDestinations: function(position) {
			origin = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};

			$(".position").html("<span>"+origin.lat+","+origin.lng+"</span>");

			$.ajax({
				type: "GET",
				url: "/nearby/",
				data: $.param(origin),
				statusCode: {
					404: function(result) {
						alert("Sorry, no destinations could be found!");
						$.mobile.hidePageLoadingMsg();
					},
					500: function() {
						alert('Server returned HTTP 500, use Firebug or Chrome JavaScript console for more info.');
						$.mobile.hidePageLoadingMsg();
					}
				},
				success: function(result) {
					var startSelect = document.getElementById("mobile-start");
					var endSelect = document.getElementById("mobile-end");
					var resultLength = result.length;
					var startOptions = "";
					var endOptions = "";

					for (var i = 0; i < resultLength; i++) {
						startOptions += addOption(startSelect, result[i]);
						endOptions += addOption(endSelect, result[i]);
					}

					$(startSelect).html(startOptions);
					$(endSelect).html(endOptions);
			
					//Add default option to the DOM for the user's Current Position
					var opt = document.createElement("option");
					opt.value = "";
					opt.text = "Current Position";
					//Add the new option to the beginning of the options list
					startSelect.add(opt, startSelect.options[0]);
					//Ensure the first item in the list is selected by default
					startSelect.selectedIndex = 0;
					endSelect.selectedIndex = 0;
					$("#mobile-end").selectmenu("refresh");

					navigator.geolocation.clearWatch(watch);	

					//Hide ajax loading message
					$.mobile.hidePageLoadingMsg();
				}
			});
		},

		/**
		 * updatePosition
		 * @param Object position Geolocation object
		 */
		updatePosition: function(position) {
			var distance = haversine(
				position.coords.longitude,
				position.coords.latitude,
				dest[1],
				dest[0]	
			)
	
			//Distance is in miles - if distance is equal to or less than 25ft alert the user
			if (distance <= 0.00946969697) {
				$("#mobile-track-stop").trigger("click");
				alert("Destination reached");
			}

			var latlng = new google.maps.LatLng(
				position.coords.latitude,
				position.coords.longitude
			);

			markerOptions.position = latlng;
			var marker = new google.maps.Marker(markerOptions);

			if (previousMarker) {
				previousMarker.setMap(null);
				previousMarker = marker;
			} else {
				previousMarker = marker;
			}

			//If the marker is contained in the current map bounds, place the maker
			//Otherwise, panto the new latlng and set that to the map center and update mapBounds.
			if (map.getBounds().contains(latlng)) {
				marker.setMap(map);
			} else {
				map.panTo(latlng);
				map.setBounds(latlng);
				marker.setMap(map);
			}
		},

		/**
		 * handleError
		 * @param Object error Geolocation error message
		 */
		handleError: function(error) {
			switch (error.code) {
				case error.PERMISSION_DENIED:
					alert('Permission was denied');
					break;
				case error.POSITION_UNAVAILABLE:
					alert('Position is currently unavailable.');
					break;
				case error.PERMISSION_DENIED_TIMEOUT:
					alert('User took to long to grant/deny permission.');
					break;
				case error.UNKNOWN_ERROR:
					alert('An unknown error occurred.')
					break;
			}
		},

		/**
		 * Navigator.geolocation options
		 */
		options: {
			enableHighAccuracy: true, //this should make the device provide geoposition data from GPS
			timeout: 10000, //time out after 10 seconds
			maximumAge: 0 //only accept cached location that are 2 min old
		}
	};
};

// Watch ID global
var watch = null;
// Initial position global
var origin = {};

// On page load
$(".firstpage").live("pageshow", function() {
	window.scrollTo(0,1);
	// Namespace global
	wMobile = WayFinderMobile();
	if (navigator.geolocation) {
		$.mobile.showPageLoadingMsg();
		//setTimeout(function() {
			watch = navigator.geolocation.watchPosition(wMobile.getDestinations,wMobile.handleError,wMobile.options);
		//},500);
	} else {
		alert("Your browser does not support geolocation");
	}
});

/**
 * When the map page is rendered, find the current position and initialize the map accoordingly
 */
$("#two").live("pageshow", function() {
	window.scrollTo(0,1);
	if (navigator.geolocation) {
		//navigator.geolocation.getCurrentPosition(wMobile.initialize, wMobile.handleError, wMobile.options);
		wMobile.initialize(origin);
		var watchID;

		$("#mobile-track").click(function() {
			//Checks position every 5 seconds
			watchID = navigator.geolocation.watchPosition(wMobile.updatePosition, wMobile.handleError, wMobile.options);
		});

		$("#mobile-track-stop").click(function() {
			navigator.geolocation.clearWatch(watchID);
		});

	} else {
		wMobile.initialize(38.94617, -92.32866);
	}
});
