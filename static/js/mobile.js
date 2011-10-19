var WayFinderMobile = function() {
	var testPolylineOptions = {
		strokeColor: "#FFE303",
		strokeOpacity: 1.0,
		strokeWeight: 4,
		zIndex: 500,
		clickable: false
	};

	var map = null;
	var previousPath;

	/**
	* route
	* Performs ajax call to findpath. If lat,lng are present start from those coordinates to the destination.
	*/
	//function route(lat, lng) {
	function route(start) {
		var params = {
			csrfmiddlewaretoken: $("#csrfmiddlewaretoken").val(),
			start: start,
			end: $("#mobile-end").val()
		}

		var data = $.param(params);
		/*
		if (typeof lat != undefined && typeof lng != undefined) {
			var start = lat + "," + lng;
			params = {
				csrfmiddlewaretoken: $("#csrfmiddlewaretoken").val(),
				start: start,
				end: $("#mobile-end").val()
			}

			data = $.param(params);
		} else {
			data = $("#mobile-findpath").serialize();
		}
		*/

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
				$.mobile.hidePageLoadingMsg();
			}
		});
	}

	return {
		/**
		 * initialize
		 * @param Number lat Latitude
		 * @param Number lng Longitude
		 * @param Boolean geo Flag for hardware support of geolocation
		 * Create the map
		 */
		initialize: function(lat, lng) {
			var latlng = new google.maps.LatLng(lat, lng);
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
				start = lat + "," + lng;
				route(start);
			}
		}
	};
};

/**
 * When the map page is rendered, find the current position and initialize the map accoordingly
 */
$("#two").live("pageshow", function() {
	wMobile = WayFinderMobile();

	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position){
			wMobile.initialize(position.coords.latitude, position.coords.longitude);
			//console.log(position.coords.latitude, position.coords.longitude);
		});
		//var watchID = navigator.geolocation.watchPosition(function(postition)) {
		//	updateMenu(position.coords.latitude,position.coords.longitude);
		//});
	} else {
		wMobile.initialize(38.94617, -92.32866);
	}
});
