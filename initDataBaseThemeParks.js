// include the Themeparks library
const Companion = require('./Companion');
const async = require('async');
const ridesData = require('./data/rides');
const destinationsData = require('./data/destinations');
// Connection to the database
Companion.connect(function() {
    console.log('Connected to DB')

    async.eachOf(destinationsData, function(destination, destination_id, callback){
        Companion.Destination.create({
            _id: destination_id,
            name: destination.name,
            boundingBox: destination.boundingbox,
            loc: {
                coordinates: [destination.lat, destination.lng]
            },
            polygon: {
                coordinates: destination.polygon
            }
        // Callback when it is done
        }, function (err, destination) {
            // Return error
            if (err) console.log(err);
            callback();
        })
        
    }, function() {
        console.log('All destinations created');
        
        Companion.getRides(function(rides) {
            console.log('Rides recovered from source')
            
            rides.sort(function(a, b) {
                var id_a = a.id.split('_')[1].toLowerCase(), id_b = b.id.split('_')[1].toLowerCase();
                return id_a > id_b ? 1 : id_a < id_b ? -1 : 0;
            });
            let rideIdCollection = Array.from(rides, x => x.id.split('_')[1]);

            async.each(rides, function (ride, callback) {
                let ride_id = ride.id.split('_')[1]

                let destinations = [];
                let walkTimeMatrixModel = rideIdCollection.slice(rideIdCollection.indexOf(ride_id)+1, rideIdCollection.length);
                let walkTimeMatrix = {};

                for (id of walkTimeMatrixModel) {
                    walkTimeMatrix[id] = null
                    destinations.push({
                        lat: ridesData[id].coordinates[0],
                        lng: ridesData[id].coordinates[1]
                    })
                }

                Companion.getWalkTime([ridesData[ride_id].coordinates], destinations).then(function(response) {

                    if (response.status === 200) {
                        for (row of response.json.rows) {
                            for (element_index in row.elements) {
                                walkTimeMatrix[walkTimeMatrixModel[element_index]] = row.elements[element_index].duration.value
                            }
                        }
                    }
                    
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
                            duration: ridesData[ride_id].duration,
                        },
                        walkTimeMatrix : walkTimeMatrix,
                        loc: {
                            coordinates: ridesData[ride_id].coordinates,
                        }
                    // Callback when it is done
                    }, function (err, ride) {
                        // Return error
                        if (err) console.log(err);
                        callback();
                    })
                }).catch(function(err) {
                    if (err) console.log(err);
                    callback();
                })
            }, function (err) {
                if (err) console.log(err);
                console.log('All Rides created');
                console.log('Closing connection');
                Companion.endConnection()
            })
        })
    })
})
