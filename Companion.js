const mongoose = require('mongoose');
const Themeparks = require("themeparks");
const googleMapsClient = require('@google/maps').createClient({
    key: "AIzaSyDXVHnglTdFoy6oNw_OTKnnZhGMOQ-RA7I",
    Promise: Promise
});

let companion =  {

    // Get the parks from Themeparks module
    dlpPark: new Themeparks.Parks.DisneylandParisMagicKingdom(),
    wdsPark: new Themeparks.Parks.DisneylandParisWaltDisneyStudios(),

    // Connection object
    connection: mongoose.connection,

    config: {
        timeMargin: 300
    },

    // Ride
    Ride: require('./api/models/Ride'),
    // Model Destination
    Destination: require('./api/models/Destination'),

    // Connection to the database
    connect: function(callback) {
        mongoose.connect('mongodb://localhost/dlp_test');
        this.connection.once('open', function() {
            callback();
        });
        this.connection.on('error', console.error.bind(console, 'connection error:'));
    },

    // Get Rides wait times form Themeparks module
    getRides: function(callback) {
        // Get wait times from the parks as Promises
        let dlpRides = this.dlpPark.GetWaitTimes();
        let wdsRides = this.wdsPark.GetWaitTimes();

        // @param array[array of rides, array of rides]
        Promise.all([dlpRides, wdsRides]).then(function(rides) {
            // Concat the two arrays in one
            rides = [].concat.apply([], rides);
            callback(rides);
        })
    },

    // Get walk time between origins and destinations form the Google Map Distance Matrix API
    getWalkTime: function(origins, destinations) {
        if (destinations.length) {
            // Return a Promise
            return googleMapsClient.distanceMatrix({
                origins: origins,
                destinations: destinations,
                mode: 'walking',
            }).asPromise();
        } else {
            // If there are no destinations (case for the last ride of the list)
            // Return a always true Promise, to still execute the "then" function
            return new Promise(function(resolve) {
                resolve(true);
            })
        }
    },

    // Close the connection to the database
    endConnection: function() {
        this.connection.close();
    }
}

module.exports = companion;
