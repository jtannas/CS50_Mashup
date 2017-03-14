/* -------------------------------------------------------------------------
*  -------------------------------------------------------------------------
*  Desc.:      Scripts for Mashup
*  Purpose:    completing the exercise CS50/pset8 2017/mashup
*  Author:     CS50   /   reformatted by Joel Tannas 
*  Date:       ?      /   Feb 16, 2017
*    
*  Licensing Info:
*  ?
*  -------------------------------------------------------------------------
*  -----------------------------------------------------------------------*/

/* -------------------------------------------------------------------------
*   Desc.:      GLOBAL VARIABLES
* ------------------------------------------------------------------------*/
// Google Map
var map;

// markers for map
var markers = [];

// info window
var info = new google.maps.InfoWindow();

/* -------------------------------------------------------------------------
*   Desc.:      Anonymous function, executes when DOM is fully loaded
*   Purpose:    Configures the style of the google map and instantiates it
*   Author:     CS50   /   reformatted by Joel Tannas 
*   Date:       ?      /   Feb 16, 2017
*
*   Bugs, Limitations, and Other Notes:
*   - 
* ------------------------------------------------------------------------*/

// execute when the DOM is fully loaded
$(function() {
    
    // --- Section 010: Map Configuration   
    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [
        
 
        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "off"}
            ]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "off"}
            ]
        }

    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 37.4236, lng: -122.1619}, // Stanford, California
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        maxZoom: 14,
        panControl: true,
        styles: styles,
        zoom: 13,
        zoomControl: true
    };
    
    // --- Section 020: Map Initialization
    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

});

/* -------------------------------------------------------------------------
*   Desc.:      function addMarker( place As jsonified database entry)
*   Purpose:    adds a marker to a google map for a given place (eg. Zipcode)
*   Author:     Joel Tannas 
*   Date:       Feb 16, 2017
*
*   Bugs, Limitations, and Other Notes:
*   - http://docs.cs50.net/problems/mashup/mashup.html#code-addmarker-code
*   - help from https://developers.google.com/maps/documentation/javascript/examples/event-simple
*   - label help: http://stackoverflow.com/questions/37441729/google-maps-custom-label-x-and-y-position
* ------------------------------------------------------------------------*/
function addMarker(place)
{ 
    // --- Section 010: Instantiate Marker
    var icon = {
        url: "http://maps.google.com/mapfiles/kml/pal2/icon23.png",
        size: new google.maps.Size(32, 32),
        scaledSize: new google.maps.Size(32, 32),
        labelOrigin: new google.maps.Point(16, -10)
    }
    
    var marker = new google.maps.Marker({
        icon: icon,
        label: place.place_name + ", " + place.admin_name1,
        position: {lat: place.latitude, lng: place.longitude},
        map: map
    });
    
    // --- Section 020: Listen for clicks on marker
    marker.addListener("click", function() {
        
        // Get Articles for Place
        $.getJSON(Flask.url_for("articles"), place)
        .done(function(data, textStatus, jqXHR) {
            
            // Build a list of links to articles
            var content = "<ul>"
            for (var i = 0; i < data.length; i++)
            {
               content += "\t<li><a href=\"" + data[i].link + "\">" + data[i].title + "</a></li>"
            }
            content +="</ul>"
            showInfo(marker, content)
            
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
    
            // log error to browser's console
            console.log(errorThrown.toString());
        });
})
    
    // --- Section 030: Remember Marker
    markers.push(marker)
}

/* -------------------------------------------------------------------------
*   Desc.:      function configure( Void )
*   Purpose:    Configures Application behaviour (response to events)
*   Author:     CS50   /   reformatted by Joel Tannas 
*   Date:       ?      /   Feb 16, 2017
*
*   Bugs, Limitations, and Other Notes:
*   - 
* ------------------------------------------------------------------------*/
function configure()
{
    // --- Section 010: update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {

        // if info window isn't open, update
        // http://stackoverflow.com/a/12410385
        if (!info.getMap || !info.getMap())
        {
            update();
        }
    });

    // --- Section 020: update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // --- Section 030: configure typeahead
    $("#q").typeahead({
        highlight: false,
        minLength: 1
    },
    {
        display: function(suggestion) { return null; },
        limit: 10,
        source: search,
        templates: {
            suggestion: Handlebars.compile(
                "<div>" +
                "{{place_name}}, {{admin_name1}}, {{postal_code}}" +
                "</div>"
            )
        }
    });

    // --- Section 040: re-center map after place is selected from drop-down
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

        // set map's center
        map.setCenter({lat: parseFloat(suggestion.latitude), lng: parseFloat(suggestion.longitude)});

        // update UI
        update();
    });

    // --- Section 050: hide info window when text box has focus
    $("#q").focus(function(eventData) {
        info.close();
    });

    // --- Section 060: re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true; 
        event.stopPropagation && event.stopPropagation(); 
        event.cancelBubble && event.cancelBubble();
    }, true);

    // --- Section 060: Update, clean up, and finish
    // update UI
    update();

    // give focus to text box
    $("#q").focus();
}

/* -------------------------------------------------------------------------
*   Desc.:      function removeMarkers( Void )
*   Purpose:    Removes Markers from Map
*   Author:     Joel Tannas 
*   Date:       Feb 16, 2017
*
*   Bugs, Limitations, and Other Notes:
*   - http://docs.cs50.net/problems/mashup/mashup.html#removemarkers-2
*   - help from http://stackoverflow.com/a/1232046
*   - more help from https://developers.google.com/maps/documentation/javascript/examples/marker-remove
* ------------------------------------------------------------------------*/
function removeMarkers()
{
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null)
    }
    markers = [];
}

/* -------------------------------------------------------------------------
*   Desc.:      function search( query as text, syncResults, asyncResults)
*   Purpose:    Searches database for typeahead's suggestions.
*   Author:     Joel Tannas 
*   Date:       Feb 16, 2017
*
*   Bugs, Limitations, and Other Notes:
*   - 
* ------------------------------------------------------------------------*/
function search(query, syncResults, asyncResults)
{
    // get places matching query (asynchronously)
    var parameters = {
        q: query
    };
    $.getJSON(Flask.url_for("search"), parameters)
    .done(function(data, textStatus, jqXHR) {
     
        // call typeahead's callback with search results (i.e., places)
        asyncResults(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());

        // call typeahead's callback with no results
        asyncResults([]);
    });
}

/* -------------------------------------------------------------------------
*   Desc.:      function showInfo(marker as object, content as html)
*   Purpose:    Shows info window at marker with content.
*   Author:     CS50    /   Reformatted by Joel Tannas
*   Date:       ?       /   Feb 16, 2017
*
*   Bugs, Limitations, and Other Notes:
*   - 
* ------------------------------------------------------------------------*/
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) == "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='/static/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/* -------------------------------------------------------------------------
*   Desc.:      function update( void )
*   Purpose:    Updates UI's markers.
*   Author:     CS50    /   Reformatted by Joel Tannas
*   Date:       ?       /   Feb 16, 2017
*
*   Bugs, Limitations, and Other Notes:
*   - 
* ------------------------------------------------------------------------*/
function update() 
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    var parameters = {
        ne: ne.lat() + "," + ne.lng(),
        q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };
    
    // get news data for places within the parameters
    $.getJSON(Flask.url_for("update"), parameters)
    .done(function(data, textStatus, jqXHR) {

       // remove old markers from map
       removeMarkers();
    
       // add new markers to map
       for (var i = 0; i < data.length; i++)
       {
           addMarker(data[i]);
       }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
};
