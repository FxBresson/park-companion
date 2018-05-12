// include the Themeparks library
const Companion = require('./Companion');

Companion.connect(function() {

    let dlpRides = Companion.dlpPark.GetWaitTimes();
    let wdsRides = Companion.wdsPark.GetWaitTimes();

    Promise.all([dlpRides, wdsRides]).then(function(rides) {
        rides = [].concat.apply([], rides);
        let counter = 0;
        for (ride of rides) {
            Companion.Ride.create({
                _id: ride.id.split('_')[1],
                name: ride.name,
                infos: {
                    park: ride.id.split('_')[1].substr(0, 2),
                    fastPass: ride.fastPass,
                    //duration: ridesData[ride.id.split('_')[1]].duration,
                    geoloc: {
                        lat: 0,
                        long: 0
                    }, //merge direct le ridesData avec rideObj.info ?
                },
            }, function (err, ride) {
                if (err) return handleError(err);
                if (++counter == rides.length) {
                    Companion.endConnection()
                }
                // saved!
            })
        }
    })
})