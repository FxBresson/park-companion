// include the Themeparks library
const Companion = require('./Companion');

// Connection to the database
Companion.connect(function() {

    // Get wait times from the parks
    let dlpRides = Companion.dlpPark.GetWaitTimes();
    let wdsRides = Companion.wdsPark.GetWaitTimes();

    // One promise for each park
    // @param array[array of rides,array of rides]
    Promise.all([dlpRides, wdsRides]).then(function(rides) {
        // All rides from the two parks
        // Concat two arrays in one array
        rides = [].concat.apply([], rides);

        // Counter for each ride
        let counter = 0;

        for (ride of rides) {
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

                // For each ride
                if (++counter == rides.length) {
                    // Close the connection to the database
                    Companion.endConnection()
                }
                // saved!
            })
        }
    })
})
