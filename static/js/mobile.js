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
		animation: google.maps.Animation.DROP,
	};

	var map = null;
	var previousPath;
	var previousMarker;

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

		//Ajax loadeing
		$.mobile.showPageLoadingMsg();

		$.ajax({
			type: "POST",
			url: "/findpath/",
			data: data,
			statusCode: {
				404: function(result) {
					alert(result);
				},
				500: function() {
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

				if (previousPath) {
					previousPath.setMap(null);
					previousPath = testPath;
				} else {
					previousPath = testPath;
				}

				var centerLatLng = new google.maps.LatLng(result.returned_path[0][0], result.returned_path[0][1]);
				map.setCenter(centerLatLng);
				testPath.setMap(map);

				//Array of objects containing markerOptions for start/stop positions on the map
				var routeMarkers = [{text: "Start", color: "00FF00", pos: path[0]},{text: "Stop", color: "FF0000", pos: path.pop()}];
				for (var i = 0; i < routeMarkers.length; i++) {
					var marker = new StyledMarker({
									styleIcon: new StyledIcon(
										StyledIconTypes.BUBBLE, {
												color: routeMarkers[i].color,
												text: routeMarkers[i].text,
										}),
									position: routeMarkers[i].pos,
									animation: google.maps.Animation.DROP,
									draggable: false
								});

					marker.setMap(map);
				}

				//Indicate starting point

				//Messy, but appends route travel data to DOM
				$("#route-details").html("<dl>"
					+ "<dt>Distance:</dt>" + "<dd>" + result.distance + " miles</dd>"
					+ " <dt>Walking Time:</dt>" + "<dd>" + result.walking_time  + " minutes</dd>"
					+ "</dl>"
				);

				//Hide ajax loading message
				$.mobile.hidePageLoadingMsg();
			}
		});
	}

	return {
		/**
		 * initialize
		 * @param Object position Navigator geolocation object
		 * @param Boolean geo Flag for hardware support of geolocation
		 * Create the map
		 */
		initialize: function(position) {
			var latlng = new google.maps.LatLng(
				position.coords.latitude,
				position.coords.longitude
			);

			var myOptions = {
				zoom: 18,
				center: latlng,
				mapTypeId: google.maps.MapTypeId.SATELLITE
			};

			map = new google.maps.Map(document.getElementById("map_canvas"),myOptions);

			/*
			 * If the start position is set to something besides "Current Position", use that value.
			 * Otherwise, use the lat and lng provide by the GPS device.
			 */
			var start;
			if ($("#mobile-start").val()) {
				start = $("#mobile-start").val();
				route(start);
			} else {
				start = position.coords.latitude + "," + position.coords.longitude;
				route(start);
			}
		},

		/**
		 * updatePosition
		 * @param Object position Geolocation object
		 */
		updatePosition: function(position) {
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
			marker.setMap(map);
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
			enableHighAccuracy: true,
			timeout: 30000, //time out after 10 seconds
			maximumAge: 120000 //only accept cached location that are 2 min old
		}
	};
};

/**
 * When the map page is rendered, find the current position and initialize the map accoordingly
 */
$("#two").live("pageshow", function() {
	wMobile = WayFinderMobile();

	if(navigator.geolocation) {

		navigator.geolocation.getCurrentPosition(wMobile.initialize, wMobile.handleError, wMobile.options);
		var watchID;

		$("#mobile-track").click(function() {
			//Checks position every 5 seconds
			watchID = navigator.geolocation.watchPosition(wMobile.updatePosition, wMobile.handleError, {enableHighAccuracy: true, frequency: 5000});
			alert("Position updates enabled");
		});

		$("#mobile-track-stop").click(function() {
			navigator.geolocation.clearWatch(watchID);
			alert("Position updates disabled");
		});

	} else {
		wMobile.initialize(38.94617, -92.32866);
	}
});
