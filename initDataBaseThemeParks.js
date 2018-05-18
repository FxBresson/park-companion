// include the Themeparks library
const Companion = require('./Companion');
const async = require('async');

// Connection to the database
Companion.connect(function() {

    Companion.getRides(function(rides) {

        rides.sort(function(a, b) {
            var id_a = a.id.split('_')[1].toLowerCase(), id_b = b.id.split('_')[1].toLowerCase();
            return id_a > id_b ? 1 : id_a < id_b ? -1 : 0;
        });

        let rideIdCollection = Array.from(rides, x => x.id.split('_')[1]);
        let distances = {}

        for (let from_index in rideIdCollection) {
            from = rideIdCollection[from_index];
            distances[from] = {};
            for (let to_index = (parseInt(from_index)+1); to_index < rideIdCollection.length; to_index ++) {
                let to = rideIdCollection[to_index]
                distances[from][to] = 10;
                // distances[from][to] = getDistance(from, to);
            }
        }

        // db.places.find( { loc : { $near : [50,50] } } ).limit(20)

        console.log(distances)

        async.each(rides, function (ride, callback) {
            let ride_id = ride.id.split('_')[1]
            // Data for the database
            Companion.Ride.create({
                // ID of the ride
                _id: ride_id,
                // Name of the ride
                name: ride.name,
                // Information of the ride
                infos: {
                    park: ride.id.split('_')[1].substr(0, 2),
                    fastPass: ride.fastPass,
                    duration: Companion.ridesData[ride_id].duration,
                },
                walkTimeMatrix : distances[ride_id],
                loc: {
                    coordinates: Companion.ridesData[ride_id].coordinates,
                }
            // Callback when it is done
            }, function (err, ride) {
                // Return error
                if (err) console.log(err);
                callback();
            })
        }, function (err) {
            if (err) console.log(err);
            Companion.endConnection()
        })
    })
})
