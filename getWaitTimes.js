// include the Themeparks library
const Companion = require('./Companion');
const moment = require('moment');
const async = require('async');

Companion.connect(function() {

    let dlpRides = Companion.dlpPark.GetWaitTimes();
    let wdsRides = Companion.wdsPark.GetWaitTimes();

    let today = moment().unix();
    let day = moment().startOf('day').unix()
    let time = moment().diff(moment().startOf('day'), 'seconds')
    console.log(time);
    //moment.unix(day).add(time, 's')

    let counter = 0;


    Promise.all([dlpRides, wdsRides]).then(function(rides) {
        rides = [].concat.apply([], rides);

        async.each(rides, function (ride, callback) {
            let counter = 0;

            Companion.Ride.findById(ride.id.split('_')[1], function (err, rideObj) {
                if (err) return handleError(err);
              
                // console.log(rideObj)
                // console.log(rideObj.realTime, rideObj.realTime == undefined, rideObj.realTime == 'undefined')
                // if(rideObj.realTime == undefined) {
                //     // rideObj.realTime.schedule = {}
                //     rideObj.waitTimesRecorded = {}
                // }
                
                rideObj.realTime.waitTime = ride.waitTime
                rideObj.realTime.lastUpdate = ride.lastUpdate
                rideObj.realTime.active = ride.active
                rideObj.realTime.status = ride.status
                
                if (moment(rideObj.realTime.schedule.opening).startOf('day').unix() != day) {
                    rideObj.realTime.schedule.opening = moment(ride.schedule.openingTime).unix()
                    rideObj.realTime.schedule.closing = moment(ride.schedule.closingTime).unix()
                    rideObj.realTime.schedule.dayStatus = ride.schedule.type                   
                }

                if (rideObj.waitTimesRecorded == undefined) {
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
        }, function (err) {
            if (err) console.log(err);
            Companion.endConnection()
        });
    })
});

