const mongoose = require('mongoose');
const Themeparks = require("themeparks");
const data = require("./data")
const googleMapsClient = require('@google/maps').createClient({
    key: "AIzaSyDXVHnglTdFoy6oNw_OTKnnZhGMOQ-RA7I",
    Promise: Promise
});


let companion =  {

    // Get the parks
    dlpPark: new Themeparks.Parks.DisneylandParisMagicKingdom(),
    wdsPark: new Themeparks.Parks.DisneylandParisWaltDisneyStudios(),

    //
    connection: mongoose.connection,

    config: {
        timeMargin: 300
    },

    // Model Ride
    Ride: require('./api/models/Ride'),

    // Connection to the database
    connect: function(callback) {
        mongoose.connect('mongodb://localhost/dlp_test');
        this.connection.once('open', function() {
            callback();
        });
        this.connection.on('error', console.error.bind(console, 'connection error:'));
    },

    getRides: function(callback) {
        // Get wait times from the parks
        let dlpRides = this.dlpPark.GetWaitTimes();
        let wdsRides = this.wdsPark.GetWaitTimes();

        // One promise for each park
        // @param array[array of rides,array of rides]
        Promise.all([dlpRides, wdsRides]).then(function(rides) {
            // All rides from the two parks
            // Concat two arrays in one array
            rides = [].concat.apply([], rides);
            callback(rides);
        })
    },

    getWalkTime: function(origins, destinations) {
        if (destinations.length) {
            return googleMapsClient.distanceMatrix({
                origins: origins,
                destinations: destinations,
                mode: 'walking',
            }).asPromise();
        } else {
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
