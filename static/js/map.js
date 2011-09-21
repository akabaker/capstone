/**
 * Map
 *
 * Object for created google maps
 *
 */
var Map = function() {
	var geoCodeURL = 'https://maps.googleapis.com/maps/api/geocode/json';
	var geoCodeURI = '/geocode/';
	var sensor = 'false';
	var address = 'Columbia, MO';

	$("#geocode-btn").button({ icons: { primary: "ui-icon-search"} });
	
	/**
	* Parses geocode results and calls init to reload the map canvas
	*
	* @param Object obj This object is the parsed json data; it is the geocode result
	* @param Object ref A reference to the Map object
	*
	*/
	function geoCodeCallback(obj) {

		// Geocode result is a json object
		var lat = obj.results[0].geometry.location.lat;
		var lng = obj.results[0].geometry.location.lng;

		// Rebuild the map using the returned coordinates
		initialize(lat, lng);
	}

	/**
	* Performs a geocode query to google maps api
	*
	* @param String address Street address to look up
	* @param String geoCodeURL Google api geocode url
	* @param String sensor Enable or disable GPS sensor (for smart phones and devices)
	*
	*/
	function geoCode(address, geoCodeURL, sensor) {
		//var address = typeof(address) != 'undefined' ? address : self.address;
		//var geoCodeURL = typeof(geoCodeURL) != 'undefined' ? geoCodeURL : self.geoCodeURL;
		//var sensor = typeof(sensor) != 'undefined' ? sensor : self.sensor;

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

	/**
	* Builds the map, defaults to a location on MU campus
	*
	* @param Number lat The latitude of the goecode location
	* @param Number lng The longitude of the geocode location
	*
	*/
	function initialize(lat, lng) {

		//Default values for MU campus
		lat = typeof(lat) != 'undefined' ? lat : 38.94617;
		lng = typeof(lng) != 'undefined' ? lng : -92.32866; 

		$("#geocode-btn").click(function() {
			try {
				geoCode($("#geocode-address").val(), geoCodeURL, sensor);
			} catch (error) {
				console.log(error.message);
			}
		});

		var latlng = new google.maps.LatLng(lat, lng);
		var myOptions = {
			zoom: 19,
			center: latlng,
			mapTypeId: google.maps.MapTypeId.HYBRID
		};

		var map = new google.maps.Map(document.getElementById('map-canvas'), myOptions);

		//google.maps.event.addListener(map, 'bounds_changed', function(event) {
		//	var bounds = map.getBounds();
		//});

		return map;
	}

	/**
	 * Public methods
	 */
	return {
		init: function() {
			return initialize();
		}
	};
};
