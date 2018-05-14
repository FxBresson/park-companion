// include the Themeparks library
const Companion = require('./Companion');
const async = require('async');

// Connection to the database
Companion.connect(function() {

    Companion.getRides(function(rides) {

        async.each(rides, function (ride, callback) {
            // Data for the database
            Companion.Ride.create({
                // ID of the ride
                _id: ride.id.split('_')[1],
                // Name of the ride
                name: ride.name,
                // Information of the ride
                infos: {
                    park: ride.id.split('_')[1].substr(0, 2),
                    fastPass: ride.fastPass,
                    //duration: ridesData[ride.id.split('_')[1]].duration,
                    geoloc: {
                        lat: 0,
                        long: 0
                    }, //merge direct le ridesData avec rideObj.info ?
                },

            // Callback when it is done
            }, function (err, ride) {
                // Return error
                if (err) return handleError(err);
                callback();
            }, function (err) {
                if (err) console.log(err);
                Companion.endConnection()
            })
        }
    })
})
