const Companion = require('./Companion');
const moment = require('moment');
const async = require('async');

// Connection to the database
Companion.connect(function() {

    // Get current unix (timestamp in second)
    let today = moment().unix();
    // Get current day and time at midnight
    let day = moment().startOf('day').unix();
    // Get current from midnight to now in seconds
    let time = moment().diff(moment().startOf('day'), 'seconds');
    //moment().unix(day).add(time, 's');

    // Get the earliest opening and the latest closing of the day 
    Companion.Ride.find({"realTime.schedule.dayStatus" : {$ne : 'Refurbishment' } }, {"realTime.schedule.closing": 1})
                  .sort({"realTime.schedule.closing": -1})
                  .limit(1)
                  .then(function(later) {
        later = later[0].realTime.schedule.closing
        Companion.Ride.find({"realTime.schedule.dayStatus" : {$ne : 'Refurbishment' } }, {"realTime.schedule.opening": 1})
                      .sort({"realTime.schedule.opening": 1})
                      .limit(1)
                      .then(function(earlier) {
            earlier = earlier[0].realTime.schedule.opening;

            // If now is between theses times or if it's another day
            if (moment().isBetween(earlier, later, null, "[]") || !moment().isSame(later, "day")) {
                
                Companion.getRides(function(rides) {
                    // For each ride
                    async.each(rides, function (ride, callback) {
            
                        // Find the ride in the database
                        Companion.Ride.findById(ride.id.split('_')[1], function (err, rideObj) {

                            // Update real time information if it's the same day
                            if (moment().isSame(later, "day")) {
                                rideObj.realTime.waitTime = ride.waitTime;
                                rideObj.realTime.lastUpdate = ride.lastUpdate;
                                rideObj.realTime.active = ride.active;
                                rideObj.realTime.status = ride.status;
                            }
                            
                            // Update schedule if it's not the same day
                            if (rideObj.realTime.schedule.dayStatus == undefined || !moment().isSame(later, "day")) {
                                rideObj.realTime.schedule.opening = ride.schedule.openingTime;
                                rideObj.realTime.schedule.closing = ride.schedule.closingTime;
                                rideObj.realTime.schedule.dayStatus = ride.schedule.type;
                            }
            
                            if (rideObj.waitTimesRecorded == undefined) {
                                rideObj.waitTimesRecorded = {};
                            }
            
                            // Add wait time to wait time history
                            if (!rideObj.waitTimesRecorded.hasOwnProperty(day)) {
                                rideObj.waitTimesRecorded[day] = {};
                            }
                            rideObj.waitTimesRecorded[day][time] = ride.waitTime;
                            rideObj.markModified('waitTimesRecorded');

                            rideObj.save(function (err, ride) {
                                // Callback when the ride is saved
                                if (err) console.log(err);
                                callback();
                            });
                        });
                    }, function (err) {
                        // Callback when all the rides are saved
                        if (err) console.log(err);
                        Companion.endConnection()
                    });
                })
            } else {
                Companion.endConnection();
            }
        })
    })
});