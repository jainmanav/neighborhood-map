var map;
showMapMessage = ko.observable(false);

function initMap() {
  "use strict";
  var mapOptions = {
    zoom: 13,
    center: {
      lat: 26.8467,
      lng: 80.9462
    },
  };
  map = new google.maps.Map(document.getElementById("mapDiv"), mapOptions);
  //resizing
  google.maps.event.addDomListener(window, 'resize', function() {
    var center = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(center);
  });
  ko.applyBindings(new ViewModel());
}
// Inform the user if google maps doesn't load
function googleError() {
  "use strict";
  showMapMessage(true);
}
//MODEL
var locations = [{
  name: "Bara Imam Bara",
  lat: 26.8685,
  lng: 80.9127,
}, {
  name: "Rumi Gate",
  lat: 26.8713,
  lng: 80.9121,
}, {
  name: "The Residency",
  lat: 26.8618,
  lng: 80.9257,
}, {
  name: "Chota Imambara",
  lat: 26.8733,
  lng: 80.9041,
}, {
  name: "Hazratganj",
  lat: 26.8564,
  lng: 80.9457,
}, {
  name: "Husainabad Clock Tower",
  lat: 26.8740,
  lng: 80.9080,
}];
//CONSTRUCTOR
var Place = function(data) {
  "use strict";
  var self = this;
  self.address = ko.observable('');
  self.checkins = ko.observable('');
  self.contentString = ko.observable('');
  self.lat = ko.observable(data.lat);
  self.lng = ko.observable(data.lng);
  self.marker = ko.observable();
  self.name = ko.observable(data.name);
};
//VIEW MODEL
var ViewModel = function() {
  "use strict";
  //variables
  var self = this;
  var CLIENT_ID = 'XF11KBUMHQKTEDAE0YOMH2M45SQM1LBMBY4Z21X3HI4VQ5Z1',
    CLIENT_SECRET = 'HND01K4JD5A0OR4VDFWAA3MZPQQ3REVC5YZX00QFC0KF0TXM',
    image = 'images/icon.png',
    infowindow = new google.maps.InfoWindow({
      maxWidth: 100
    }),
    location,
    marker,
    venue;
  //function for changing sidebar
  self.visibleSidebar = ko.observable(false),
    self.hideSidebar = function() {
      self.visibleSidebar(false);
      return true;
    }
  self.openSidebar = function() {
    var oppositeSidebarState = !(self.visibleSidebar());
    self.visibleSidebar(oppositeSidebarState);
    return true;
  }
  //array of places
  self.places = ko.observableArray([]);
  //foursquare error ko
  self.showMessage = ko.observable(false);
  //call the constructor!
  locations.forEach(function(placeItem) {
    self.places.push(new Place(placeItem));
  });
  //set markers, request foursquare data and set listeners
  self.places().forEach(function(placeItem) {
    //define markers
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(placeItem.lat(), placeItem.lng()),
      map: map,
      icon: image,
      animation: google.maps.Animation.DROP
    });
    placeItem.marker = marker;
    //foursquare//
    $.ajax({
      url: 'https://api.foursquare.com/v2/venues/search',
      dataType: 'json',
      data: 'limit=1' +
        '&ll=26.8467,80.9462' +
        '&query=' + placeItem.name() +
        '&client_id=' + CLIENT_ID +
        '&client_secret=' + CLIENT_SECRET +
        '&v=20130815',
      async: true,
      // If data call is successful - check for various properties and assign them to observables
      success: function(data) {
        // If incoming data has a venues object set the first one to the var venue
        venue = data.response.hasOwnProperty("venues") ? data.response.venues[0] : '';
        // If the new venue has a property called location set that to the variable location
        location = venue.hasOwnProperty('location') ? venue.location : '';
        // If new location has prop address then set the observable address to that or blank
        if (location.hasOwnProperty('address')) {
          placeItem.address(location.address || '');
        }
        // Content of the infowindow
        placeItem.contentString = '<div id="iWindow"><h3>' + placeItem.name() + '</h3>' +
          '<p>' + placeItem.address() + '</p><p>Checkins: ' + placeItem.checkins() +
          '</a></p><p><a target="_blank" href=https://www.google.com/maps/dir/Current+Location/' +
          placeItem.lat() + ',' + placeItem.lng() + '>Directions</a></p></div>';
        // Add infowindows
        google.maps.event.addListener(placeItem.marker, 'click', function() {
          infowindow.open(map, this);
          // Bounce animation
          placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function() {
            placeItem.marker.setAnimation(null);
          }, 800);
          infowindow.setContent(placeItem.contentString);
        });
      },
      // Alert the user on error
      error: function(e) {
        infowindow.setContent('<h5>Foursquare data is unavailable.</h5>');
        self.showMessage(true);
      }
    });
    //event listener for error
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, this);
      placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        placeItem.marker.setAnimation(null);
      }, 800);
    });
  });
  // Activate the right marker when the user clicks the list
  self.showInfo = function(placeItem) {
    google.maps.event.trigger(placeItem.marker, 'click');
    self.hideSidebar();
  };
  // Array containing markers based on search
  self.visible = ko.observableArray();
  // All markers are visible by default
  self.places().forEach(function(place) {
    self.visible.push(place);
  });
  // Track input
  self.userInput = ko.observable('');
  //if input matches leave marker
  self.filterMarkers = function() {
    // Set all markers and places to not visible.
    var searchInput = self.userInput().toLowerCase();
    //close current infowindows when search term entered
    infowindow.close();
    self.visible.removeAll();
    self.places().forEach(function(place) {
      place.marker.setVisible(false);
      // If user input is included in the name, set marker as visible
      if (place.name().toLowerCase().indexOf(searchInput) !== -1) {
        self.visible.push(place);
      }
    });
    self.visible().forEach(function(place) {
      place.marker.setVisible(true);
    });
  };
};