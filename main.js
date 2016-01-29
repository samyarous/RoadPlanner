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
        createRoute();
    }

    if($.url().param('print')){
        $('#option-col').addClass('hidden');
        $('#map-col').removeClass().addClass('col-md-9');
        $('#route-col').removeClass().addClass('col-md-3');
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
        <p><strong><span class="glyphicon glyphicon-play"></span> {0}  \
        (<span class="glyphicon glyphicon-time"></span> {7})</strong></p>  \
            <p class="text-info"><span class="glyphicon glyphicon-road"></span> {2} \
            <span class="glyphicon glyphicon-hourglass"></span> {3}\
            <span title="Euro95 (10l / 100km)" class="glyphicon glyphicon-oil"></span> {4}€</p> \
        <p><strong><span class="glyphicon glyphicon-play"></span> {1}  \
        (<span class="glyphicon glyphicon-time"></span> {8})</strong></p>  \
            <p class="text-info"><span class="glyphicon glyphicon-hourglass"></span> {5} \
            <span class="glyphicon glyphicon-tags"></span> {6}</p> \
    </li>                            \
'

var summaryFooterTemplate = '                                                               \
    <p><span class="glyphicon glyphicon-road"></span> {0}                              \
    <span class="glyphicon glyphicon-hourglass"></span> {1}                          \
    <span title="Euro95 (10l / 100km)" class="glyphicon glyphicon-oil"></span> {2}€</p>   \
'
function clearAll() {
    places = [];
    stops  = [];

    updateStops();
    updatePlaces();
}

function addBreak(kind){
    if ( kind ) {
        var name = "Break: {0}".format(kind)
        stops.push(
            [
                name,
                0,
                0,
                "stop",

            ]
        );
        updateStops();
    }
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
        console.log(place);
        places.push(
            [
                place.name,
                place.geometry.location.lat(),
                place.geometry.location.lng(),
                "place",
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
    var header    = $('#routeSummaryFooter');
    // clear the list first
    legs_list.empty();
    var hours    = parseInt($.url().param('hours'.format(i)))  || 7;
    var minutes = parseInt($.url().param('minutes'.format(i))) || 0;

    var totalCost     = 0;
    var totalDistance = 0;
    var totalDuration = 0;

    if ( result ) {
        var legs = result.routes[0].legs;
        for (var i=0; i<legs.length; i++){
            var pause_time = parseInt($.url().param('pause{0}'.format(i))) || 0;
            var activity   = $.url().param('activity{0}'.format(i)) || 'Passage';

            var start    = legs[i].start_address;
            var end      = legs[i].end_address;
            var distance = format_distance(legs[i].distance.value);
            var duration = format_timespan(legs[i].duration.value);
            var cost     = calculate_cost(legs[i].distance.value);

            totalCost += cost;
            totalDistance += legs[i].distance.value;
            totalDuration += legs[i].duration.value;

            var start_time = new Date(0, 0, 0, hours, minutes, 0, 0);
            minutes += Math.round(legs[i].duration.value / 60);
            var end_time = new Date(0, 0, 0, hours, minutes, 0, 0);

            var element  = legListItemTemplate.f(
                start,
                end,
                distance,
                duration,
                cost,
                format_timespan(pause_time*60),
                activity,
                format_date(start_time),
                format_date(end_time)
            );
            legs_list.append(element);

            minutes += pause_time;
        }

        header.append(
            summaryFooterTemplate.format(
                format_distance(totalDistance),
                format_timespan(totalDuration),
                Math.round(totalCost * 100) / 100
            )
        );
    }
}

function createRoute(){
    if ( stops.length < 2 ) { return; }

    var place_stops = stops.filter(function(value) { return value[3] == null || value[3] == "place"; });
    console.log(place_stops);
    var start_id = place_stops[0][0];
    var goal_id  = place_stops[place_stops.length-1][0];

    var waypoints = [];
    for(var i=1; i < place_stops.length-1; i++){
        var obj = {
            location: place_stops[i][0]
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

function format_date(date) {

    var hours   = date.getHours();
    var minutes = date.getMinutes();
    return "{0}h:{1}min".format(hours, minutes);
}

function format_timespan ( seconds ) {
    var hours   = Math.floor( seconds / 3600);
    var minutes = Math.floor( seconds / 60 ) % 60;

    if ( hours > 0 ) {
        if ( minutes > 0 ) {
            return "{0}h {1}min".format(hours, minutes);
        } else {
            return "{0}h".format(hours);
        }
    } else {
        return "{0}min".format(minutes);
    }
}

function format_distance ( distance ) {
    var km = Math.floor( distance / 1000 );
    var meters = distance % 1000;

    if ( km > 0 ) {
        return "{0}km".format(km);
    } else {
        return "{0}m".format(meters);
    }
}

function calculate_cost ( distance ) {
    var euro95Price = 1.525;
    var dieselPrice = 1.129;
    var lpgPrice    = 0.754;


    var averageCarConsumption = parseFloat($.url().param('consumption')) || 10;

    var km = Math.floor( distance / 1000 );
    var liters = km * averageCarConsumption / 100;

    var euro95Total = liters * euro95Price;
    var dieselTotal = liters * dieselPrice;
    var lpgTotal    = liters * lpgPrice;

    euro95Total = Math.round(euro95Total * 100 ) / 100;
    dieselTotal = Math.round(dieselTotal * 100 ) / 100;
    lpgTotal    = Math.round(lpgTotal * 100 ) / 100;

    return euro95Total;
}