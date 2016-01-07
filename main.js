function initialize()
{
    var mapOptions = {
        center: new google.maps.LatLng(52.5167, 13.3833),
        zoom: 5,
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    var input = document.getElementById('searchPlaces');
    autocomplete = new google.maps.places.Autocomplete(input);
    directionsService = new google.maps.DirectionsService();
    autocomplete.addListener('place_changed', addPlace);

    var stored_data = localStorage['planner_data'];
    if ( stored_data ) {
        $('#dataTextField').val(stored_data);
        importData();
    }
}
$(document).ready(initialize);

var autocomplete;
var map;
var stops   = [];
var places  = [];
var markers = [];
var directionsDisplay;
var directionsService;

String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

var placeListItemTemplate = '                                                                                   \
    <li class="list-group-item">                                                                                \
        <div class="input-group">                                                                               \
            <span class="input-group-addon">                                                                    \
                <img src="{0}" width="10px" height="16px" />                                                    \
            </span>                                                                                             \
            <p type="text" class="form-control" title="Lat: {2}; Long: {3}">{1}</p>                             \
            <span class="input-group-btn">                                                                      \
                <button class="btn btn-default" type="button" title="Mark as stop" onclick="addStop({4});">     \
                    <span class="glyphicon glyphicon-plus"></span>                                              \
                </button>                                                                                       \
                <button class="btn btn-default" type="button" title="Delete" onclick="removePlace({4});">       \
                    <span class="glyphicon glyphicon-remove"></span>                                            \
                </button>                                                                                       \
            </span>                                                                                             \
        </div>                                                                                                  \
    </li>                                                                                                       \
';

var stopListItemTemplate = '                                                                                    \
    <li class="list-group-item">                                                                                \
        <div class="input-group">                                                                               \
            <span class="input-group-addon">                                                                    \
                <b>{5}</b>                                                                                      \
            </span>                                                                                             \
            <p type="text" class="form-control" title="Lat: {1}; Long: {2}">{0}</p>                                       \
            <span class="input-group-btn">                                                                      \
                <button class="btn btn-default" type="button" title="Move Up" onclick="moveStop({3}, {4});">    \
                    <span class="glyphicon glyphicon-arrow-up"></span>                                          \
                </button>                                                                                       \
                <button class="btn btn-default" type="button" title="Move Down" onclick="moveStop({3}, {5});">  \
                    <span class="glyphicon glyphicon-arrow-down"></span>                                        \
                </button>                                                                                       \
                <button class="btn btn-default" type="button" title="Delete" onclick="removeStop({3});">        \
                    <span class="glyphicon glyphicon-remove"></span>                                            \
                </button>                                                                                       \
            </span>                                                                                             \
        </div>                                                                                                  \
    </li>                                                                                                       \
';
var legListItemTemplate = '          \
    <li class="list-group-item">     \
        <p><strong>{0}</strong></p>  \
        <p>&mdash; {2} ({3}) </p>    \
        <p><strong>{1}</strong></p>  \
    </li>                            \
'

function clearAll() {
    places = [];
    stops  = [];

    updateStops();
    updatePlaces();
}

function addStop(index)
{
    var item = places[index];
    if ( item ) {
        stops.push(item);
        updateStops();
    }
}

function removeStop(index)
{
    if ( index == null ) { index = -2 };
    if ( index  < 0 ) { index  += stops.length};
    stops.splice(index, 1);
    updateStops();
}

function moveStop(current, target){
    // save current
    var tmp = stops[current];
    // remove current
    stops.splice(current, 1);
    // // add current to the new position
    stops.splice(target, 0, tmp);
    updateStops();
}

function addPlace()
{
    var place = autocomplete.getPlace();
    if ( place ) {
        places.push(
            [
                place.formatted_address,
                place.geometry.location.lat(),
                place.geometry.location.lng(),
            ]
        );
        updatePlaces();
        $('#searchPlaces').val('');
    }
}

function removePlace(index){
    if ( index == null ) { index = -2 };
    if ( index  < 0 ) { index  += places.length};
    places.splice(index, 1);
    updatePlaces();
}

function updateStops() {
    var stops_list = $('#stopsList');
    // clear the list first
    stops_list.empty();

    for( var i=0; i < stops.length; i++){
        var item = stops[i];
        var element = stopListItemTemplate.f(
            item[0], // formatted name
            Math.round(item[1] * 100) / 100, // lat
            Math.round(item[2] * 100) / 100, // long
            i,     // index
            i - 1, // previous
            i + 1  // next and also 1 based index
        );
        stops_list.append(element);
    }
    saveData();
}

function updatePlaces() {
    var places_list = $('#placesList');
    // clear the list first
    places_list.empty();
    clearMarkers();
    places.sort();

    for( var i=0; i < places.length; i++){
        var item = places[i];
        var element = placeListItemTemplate.f(
            getIcon(i),
            item[0],
            Math.round(item[1] * 100) / 100, // lat
            Math.round(item[2] * 100) / 100, // long
            i
        );
        places_list.append(element);
        addMarker(i);
    }
    saveData();
}

function addMarker(index) {
    var item = places[index];
    if ( item ) {
        var myLatLng = {lat: item[1], lng: item[2]};
        var marker   = new google.maps.Marker({
            position: myLatLng,
            map: map,
            icon: getIcon(index),
            title: item[0]
        });
        markers.push(marker);
    }
}

function clearMarkers(){
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function reverseStops(){
    stops.reverse();
    updateStops();
}

function getMapColor(index) {
    var colors = [
        "AliceBlue",
        "AntiqueWhite",
        "Aqua",
        "Aquamarine",
        "Azure",
        "Beige",
        "Bisque",
        "Black",
        "BlanchedAlmond",
        "Blue",
        "BlueViolet",
        "Brown",
        "BurlyWood",
        "CadetBlue",
        "Chartreuse",
        "Chocolate",
        "Coral",
        "CornflowerBlue",
        "Cornsilk",
        "Crimson",
        "Cyan",
        "DarkBlue",
        "DarkCyan",
        "DarkGoldenRod",
        "DarkGray",
        "DarkGrey",
        "DarkGreen",
        "DarkKhaki",
        "DarkMagenta",
        "DarkOliveGreen",
        "DarkOrange",
        "DarkOrchid",
        "DarkRed",
        "DarkSalmon",
        "DarkSeaGreen",
        "DarkSlateBlue",
        "DarkSlateGray",
        "DarkSlateGrey",
        "DarkTurquoise",
        "DarkViolet",
        "DeepPink",
        "DeepSkyBlue",
        "DimGray",
        "DimGrey",
        "DodgerBlue",
        "FireBrick",
        "FloralWhite",
        "ForestGreen",
        "Fuchsia",
        "Gainsboro",
        "GhostWhite",
        "Gold",
        "GoldenRod",
        "Gray",
        "Grey",
        "Green",
        "GreenYellow",
        "HoneyDew",
        "HotPink",
        "IndianRed",
        "Indigo",
        "Ivory",
        "Khaki",
        "Lavender",
        "LavenderBlush",
        "LawnGreen",
        "LemonChiffon",
        "LightBlue",
        "LightCoral",
        "LightCyan",
        "LightGoldenRodYellow",
        "LightGray",
        "LightGrey",
        "LightGreen",
        "LightPink",
        "LightSalmon",
        "LightSeaGreen",
        "LightSkyBlue",
        "LightSlateGray",
        "LightSlateGrey",
        "LightSteelBlue",
        "LightYellow",
        "Lime",
        "LimeGreen",
        "Linen",
        "Magenta",
        "Maroon",
        "MediumAquaMarine",
        "MediumBlue",
        "MediumOrchid",
        "MediumPurple",
        "MediumSeaGreen",
        "MediumSlateBlue",
        "MediumSpringGreen",
        "MediumTurquoise",
        "MediumVioletRed",
        "MidnightBlue",
        "MintCream",
        "MistyRose",
        "Moccasin",
        "NavajoWhite",
        "Navy",
        "OldLace",
        "Olive",
        "OliveDrab",
        "Orange",
        "OrangeRed",
        "Orchid",
        "PaleGoldenRod",
        "PaleGreen",
        "PaleTurquoise",
        "PaleVioletRed",
        "PapayaWhip",
        "PeachPuff",
        "Peru",
        "Pink",
        "Plum",
        "PowderBlue",
        "Purple",
        "RebeccaPurple",
        "Red",
        "RosyBrown",
        "RoyalBlue",
        "SaddleBrown",
        "Salmon",
        "SandyBrown",
        "SeaGreen",
        "SeaShell",
        "Sienna",
        "Silver",
        "SkyBlue",
        "SlateBlue",
        "SlateGray",
        "SlateGrey",
        "Snow",
        "SpringGreen",
        "SteelBlue",
        "Tan",
        "Teal",
        "Thistle",
        "Tomato",
        "Turquoise",
        "Violet",
        "Wheat",
        "White",
        "WhiteSmoke",
        "Yellow",
        "YellowGreen"
    ];
}

function getIcon(index) {
    var colors = [
        "red",
        "blue",
        "yellow",
        "green",
        "orange",
        "paleblue",
        "purple",
        "brown",
        "darkgreen",
        "pink"
    ];
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    var colorIndex  = index % colors.length;
    var letterIndex =  Math.floor(index / colors.length);
    var template    = "icons/GoogleMapsMarkers/{0}_Marker{1}.png";

    return template.f(colors[colorIndex], letters[letterIndex]);
}

function updateLegs(result) {
    var legs_list = $('#legsList');
    // clear the list first
    legs_list.empty();

    if ( result ) {
        var legs = result.routes[0].legs;
        console.log(legs);
        for (var i=0; i<legs.length; i++){
            var start    = legs[i].start_address;
            var end      = legs[i].end_address;
            var distance = legs[i].distance.text;
            var duration = legs[i].duration.text;
            var element  = legListItemTemplate.f(start, end, distance, duration);
            legs_list.append(element);
        }
    }
}

function createRoute(){
    if ( stops.length < 2 ) { return; }

    var start_id = stops[0][0];
    var goal_id  = stops[stops.length-1][0];

    var waypoints = [];
    for(var i=1; i < stops.length-1; i++){
        var obj = {
            location: stops[i][0]
        };
        waypoints.push(obj);
    }

    var request = {
        origin: start_id,
        destination: goal_id,
        waypoints: waypoints,
        unitSystem: google.maps.UnitSystem.METRIC,
        travelMode: google.maps.TravelMode.DRIVING
    };
    if ( directionsDisplay ) {
        directionsDisplay.setMap(null);
    }

    directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true, panel: document.getElementById("panel")});
    directionsDisplay.setMap(map);

    directionsService.route(request, function(result, status) {
        console.log(result);
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(result);
          updateLegs(result);
        }
    });
}

function saveData(){
    var myJSONText = JSON.stringify({
        places: places,
        stops: stops,
    });
    localStorage['planner_data'] = myJSONText;
    return myJSONText;
}

function exportData(){
    $('#dataTextField').val(saveData());
}

function importData(){
    try {

        var myJSONText = $('#dataTextField').val();
        var data = JSON.parse(myJSONText);
        var placesData = data['places'];
        var stopsData  = data['stops'];

        if ( placesData ) {
            places = placesData;
        } else {
            places = [];
        }
        if ( stopsData ) {
            stops = stopsData;
        } else {
            stops = [];
        }

        updatePlaces();
        updateStops();

        localStorage['planner_data'] = myJSONText;
        $("#dataError").addClass('hidden');
    }
    catch(err) {
        $("#dataError").text("Data format is incorrect or data is corrupted!");
        $("#dataError").removeClass('hidden');
    }
    $('#dataTextField').val('');
}
