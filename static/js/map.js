/**
 * Map
 * Initializes map
 */
var Map = function() {
	var geoCodeURL = 'https://maps.googleapis.com/maps/api/geocode/json';
	var geoCodeURI = '/geocode/';
	var sensor = 'false';
	var address = 'Columbia, MO';
	
	/**
	 * Parses geocode results and calls init to reload the map canvas
	 * @param {object} obj This object is the parsed json data; it is the geocode result
	 */
	function geoCodeCallback(obj) {

		// Geocode result is a json object
		var lat = obj.results[0].geometry.location.lat;
		var lng = obj.results[0].geometry.location.lng;
		var zip = obj.results[0].address_components[7].short_name;

		// Rebuild the map using the returned coordinates
		initialize(lat, lng);
	}

	/**
	 * Performs a geocode query to google maps api
	 * @param {string} address Street address to look up
	 * @param {string} geoCodeURL Google api geocode url
	 * @param {string} sensor Enable or disable GPS sensor (for smart phones and devices)
	 */
	function geoCode(address, geoCodeURL, sensor) {
		var data = {
			address: address,
			geoCodeURL: geoCodeURL,
			sensor: sensor
		};

		$.ajax({
			type: 'POST',
			url: geoCodeURI,
			data: JSON.stringify(data),
			success: function(data) {
				// We have to call the callback from an anon function to pass the self (the Map object) reference
				geoCodeCallback(data);
			}
		});
	}

	// Check if point is within map bounds
	function isInBounds(point) {
		if (point >= bounds.sw && point <= bounds.nw) {
			console.log("point in bounds");
		}
	}

	/**
	 * Builds the map, defaults to a location on MU campus
	 * localStorage is used to load mapZoom and mapCenter values (if they have been set)
	 * @param {number} lat The latitude of the goecode location
	 * @param {number} lng The longitude of the geocode location
	 */
	function initialize(lat, lng, zoom) {
		//Default values for MU campus
		lat = typeof(lat) != 'undefined' ? lat : 38.94617;
		lng = typeof(lng) != 'undefined' ? lng : -92.32866; 
		zoom = typeof(zoom) != 'undefined' ? zoom : 18; 

		var center;
		var mapZoom;
		var latlng = new google.maps.LatLng(lat, lng);

		if (localStorage.mapCenter) {
			var parsedLatLng = JSON.parse(localStorage.mapCenter);
			center = new google.maps.LatLng(parsedLatLng.lat, parsedLatLng.lng);
		} else {
			center = latlng;
		}

		if (localStorage.mapZoom) {
			mapZoom = JSON.parse(localStorage.mapZoom);
		} else {
			mapZoom = zoom;	
		}

		var myOptions = {
			zoom: mapZoom,
			center: center,
			disableDoubleClickZoom: true,
			mapTypeId: google.maps.MapTypeId.HYBRID
		};

		var map = new google.maps.Map(document.getElementById('map-canvas'), myOptions);

		google.maps.event.addListener(map, "center_changed", function() {
			var mapCenter = {
				lat: map.getCenter().lat(),
				lng: map.getCenter().lng(),
			};

			localStorage.mapCenter = JSON.stringify(mapCenter);
		});

		google.maps.event.addListener(map, "zoom_changed", function() {
			var mapZoom = map.getZoom();
			localStorage.mapZoom = JSON.stringify(map.getZoom());
		});

		//Allow for zoom with the shift key is pressed
		map.enableKeyDragZoom();
		return map;
	}

	/**
	 * Public methods
	 */
	return {
		init: function() {
			return initialize();
		},

		getMapBounds: function(map) {
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
		},

		getMapCenter: function(map) {
			var center = [
				map.getBounds().getCenter().lat(),
				map.getBounds().getCenter().lng(),
			];

			return center;
		}
	};
};
