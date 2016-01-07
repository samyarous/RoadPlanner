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
            <p type="text" class="form-control" id="searchPlaces">{1}</p>                   \
            <span class="input-group-btn">                                                                      \
                <button class="btn btn-default" type="button" title="Mark as stop" onclick="addStop({2});">     \
                    <span class="glyphicon glyphicon-plus"></span>                                              \
                </button>                                                                                       \
                <button class="btn btn-default" type="button" title="Delete" onclick="removePlace({2});">       \
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
                <b>{3}</b>                                                                                      \
            </span>                                                                                             \
            <p type="text" class="form-control" id="searchPlaces">{0}</p>                   \
            <span class="input-group-btn">                                                                      \
                <button class="btn btn-default" type="button" title="Move Up" onclick="moveStop({1}, {2});">    \
                    <span class="glyphicon glyphicon-arrow-up"></span>                                          \
                </button>                                                                                       \
                <button class="btn btn-default" type="button" title="Move Down" onclick="moveStop({1}, {3});">  \
                    <span class="glyphicon glyphicon-arrow-down"></span>                                        \
                </button>                                                                                       \
                <button class="btn btn-default" type="button" title="Delete" onclick="removeStop({1});">        \
                    <span class="glyphicon glyphicon-remove"></span>                                            \
                </button>                                                                                       \
            </span>                                                                                             \
        </div>                                                                                                  \
    </li>                                                                                                       \
';


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
                place,
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
            item[1], // formatted name
            i,     // index
            i - 1, // previous
            i + 1  // next and also 1 based index
        );
        stops_list.append(element);
    }

    updateURL();
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
            item[1],
            i
        );
        places_list.append(element);
        addMarker(i);
    }

    updateURL();
}

function addMarker(index) {
    var item = places[index];
    if ( item ) {
        var myLatLng = {lat: item[2], lng: item[3]};
        var marker   = new google.maps.Marker({
            position: myLatLng,
            map: map,
            icon: getIcon(index),
            title: item[1]
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
        "pink",
    ];
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    var colorIndex  = index % colors.length;
    var letterIndex =  Math.floor(index / colors.length);
    var template    = "icons/GoogleMapsMarkers/{0}_Marker{1}.png";

    return template.f(colors[colorIndex], letters[letterIndex]);
}

function createRoute(){
    if ( stops.length < 2 ) { return; }

    var start_id = stops[0][1];
    var goal_id  = stops[stops.length-1][1];

    var waypoints = [];
    for(var i=1; i < stops.length-1; i++){
        var obj = {
            location: stops[i][1]
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
    console.log(request);

    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);

    directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(result);
        }
        console.log(status);
        console.log(result);
    });
}

function updateURL(){
    $("#shareLink").attr("href", getURL());
    console.log(getURL());
    console.log($("#shareLink"));
}

function getURL(){
    var places_data = [];
    for (var i=0; i < places.length; i++ ){
        places_data.push(places[i].join(seperator='|#|'));
    }
    var stops_data = [];
    for ( var i=0; i < stops.length; i++ ){
        stops_data.push(stops[i].join(seperator='|#|'));
    }

    return "./?data={0}___{1}".f(
        places_data.join(seperator='|%|'),
        stops_data.join(seperator='|%|')
    );
}

