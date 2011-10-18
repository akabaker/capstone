var testPolylineOptions = {
	strokeColor: "#FFE303",
	strokeOpacity: 1.0,
	strokeWeight: 4,
	zIndex: 500,
	clickable: false
};

var map = null;
var previousPath;
/*
$("#page1").live("pageshow", function() {
	$("#mobile-start").attr("disabled", "disabled");
	$("#checkbox-0").live("change", function() {

		if ($("#checkbox-0").is(":checked")) {
			$("#mobile-start").attr("disabled", "disabled");
			$("#mobile-start").selectmenu("refresh");
		} else {
			$("#mobile-start").removeAttr('disabled');
			$("#mobile-start").selectmenu("refresh");
		}

	});
});
*/

// When map page opens get location and display map
$('.page-map').live("pageshow", function() {
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position){
			initialize(position.coords.latitude,position.coords.longitude);
		});
	} else {
		initialize(38.94617, -92.32866);
	}
});

function initialize(lat,lng) {
	var latlng = new google.maps.LatLng(lat, lng);
	var myOptions = {
		zoom: 18,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.SATELLITE
	};
	map = new google.maps.Map(document.getElementById("map_canvas"),myOptions);
	route();
}

//$("#mobile-route").live("tap", function() {
function route() {
	var data = $("#mobile-findpath").serialize();

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
			//initialize(result.returned_path[0][0], result.returned_path[0][1]);
			map.setCenter(centerLatLng);
			testPath.setMap(map);
		}
	});
}
//});
