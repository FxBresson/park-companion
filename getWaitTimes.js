// include the Themeparks library
const Companion = require('./Companion');
const moment = require('moment');
const async = require('async');

Companion.connect(function() {

    // Get wait times from the parks
    let dlpRides = Companion.dlpPark.GetWaitTimes();
    let wdsRides = Companion.wdsPark.GetWaitTimes();

    // Get current unix (timestamp in second)
    let today = moment().unix();
    // Get current day and time at midnight
    let day = moment().startOf('day').unix();
    // Get current the amount of second from midnight to now in seconds
    let time = moment().diff(moment().startOf('day'), 'seconds');
    console.log(time);
    //moment().unix(day).add(time, 's');

    // Counter for each ride
    let counter = 0;

    // One promise for each park
    // @param array[array of rides,array of rides]
    Promise.all([dlpRides, wdsRides]).then(function(rides) {
        // All rides from the two parks
        // Concat two arrays in one array
        rides = [].concat.apply([], rides);

        // @param rides: array of rides
        // @param function(index,callback)
        async.each(rides, function (ride, callback) {
            // Counter for each ride
            let counter = 0;

            // Find the ride by ID
            Companion.Ride.findById(ride.id.split('_')[1], function (err, rideObj) {
                if (err) return handleError(err);

                // console.log(rideObj)
                // console.log(rideObj.realTime, rideObj.realTime == undefined, rideObj.realTime == 'undefined')
                // if(rideObj.realTime == undefined) {
                //     // rideObj.realTime.schedule = {}
                //     rideObj.waitTimesRecorded = {}
                // }

                rideObj.realTime.waitTime = ride.waitTime;
                rideObj.realTime.lastUpdate = ride.lastUpdate;
                rideObj.realTime.active = ride.active;
                rideObj.realTime.status = ride.status;

                if (moment(rideObj.realTime.schedule.opening).startOf('day').unix() != day) {
                    rideObj.realTime.schedule.opening = moment(ride.schedule.openingTime).unix();
                    rideObj.realTime.schedule.closing = moment(ride.schedule.closingTime).unix();
                    rideObj.realTime.schedule.dayStatus = ride.schedule.type;
                }

                if (rideObj.waitTimesRecorded == undefined) {
                    // Objet avec des clés de timestamp
                    rideObj.waitTimesRecorded = {};
                }

                if (!rideObj.waitTimesRecorded.hasOwnProperty(day)) {
                    rideObj.waitTimesRecorded[day] = {};
                }

                rideObj.waitTimesRecorded[day][time] = ride.waitTime;
                rideObj.markModified('waitTimesRecorded');

                rideObj.save(function (err, ride) {
                    if (err) console.log(err);
                    console.log(ride);
                    if (err) return handleError(err);
                    callback();
                });
            });

        // Callback when it is done
        }, function (err) {
            if (err) console.log(err);
            Companion.endConnection()
        });
    })
});
