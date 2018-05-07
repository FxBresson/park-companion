const mongoose = require('mongoose');
const Themeparks = require("themeparks");

let companion =  {
    dlpPark: new Themeparks.Parks.DisneylandParisMagicKingdom(),
    wdsPark: new Themeparks.Parks.DisneylandParisWaltDisneyStudios(),

    connection: mongoose.connection,

    ridesData: {},
    Ride: require('./api/models/Ride'),

    connect: function(callback) {
        mongoose.connect('mongodb://localhost/dlp_test');
        this.connection.once('open', function() {
            callback();
        })
        this.connection.on('error', console.error.bind(console, 'connection error:'));
    },

    endConnection: function() {
        this.connection.close();
    }
}

module.exports = companion;