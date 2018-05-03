// include the Themeparks library
const Themeparks = require("themeparks");

const dlpPark = new Themeparks.Parks.DisneylandParisMagicKingdom();

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/dlp_test');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {

    /*

    -- Identifiant
    -- Nom
    -- Localisation
    -- Sensation
    -- Durée attraction
    -- Taille autorisée
    -- FastPass ?
    -- Land

    */

    let ridesSchema = mongoose.Schema({
        _id: String,
        name: String
    })
    let rideModel = mongoose.model('Ride', ridesSchema)

    dlpPark.GetWaitTimes().then(function(rides) {

        for (ride of dlpPark.Rides) {
            ride = ride.toJSON()
            let rideObj = new rideModel({_id: ride.id})
            rideObj.save(function (err, rideSaved) {
                if (err) return console.error(err);
            });

        }
    }, console.error);
});
