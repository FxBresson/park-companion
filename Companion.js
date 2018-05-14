const mongoose = require('mongoose');
const Themeparks = require("themeparks");

let companion =  {
    // Get the parks
    dlpPark: new Themeparks.Parks.DisneylandParisMagicKingdom(),
    wdsPark: new Themeparks.Parks.DisneylandParisWaltDisneyStudios(),

    //
    connection: mongoose.connection,

    ridesData: {},

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
        let dlpRides = Companion.dlpPark.GetWaitTimes();
        let wdsRides = Companion.wdsPark.GetWaitTimes();

        // One promise for each park
        // @param array[array of rides,array of rides]
        Promise.all([dlpRides, wdsRides]).then(function(rides) {
            // All rides from the two parks
            // Concat two arrays in one array
            rides = [].concat.apply([], rides);
            callback(rides);
        })
    },

    // Close the connection to the database
    endConnection: function() {
        this.connection.close();
    }
}

module.exports = companion;
