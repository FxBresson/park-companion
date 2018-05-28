/* 
 * This script must be executed only once when deploying the API on a new environnement 
 */

const Companion = require('./Companion');
const async = require('async');
const ridesData = require('./data/rides');
const destinationsData = require('./data/destinations');

// Connection to the database
Companion.connect(function() {
    console.log('Connected to DB')

    // Init the destinations from our initial data
    async.eachOf(destinationsData, function(destination, destination_id, callback){
        // Create the destination from the Mongoose Model
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
        
        }, function (err, destination) {
            // Callback when the destination is saved
            if (err) console.log(err);
            callback();
        })
        
    }, function() {
        // Callback when all the destinations are saved
        console.log('All destinations created');
        
        Companion.getRides(function(rides) {
            console.log('Rides recovered from source')
            
            // Sort the list of rides by their id in alphabetical order
            rides.sort(function(a, b) {
                var id_a = a.id.split('_')[1].toLowerCase(), id_b = b.id.split('_')[1].toLowerCase();
                return id_a > id_b ? 1 : id_a < id_b ? -1 : 0;
            });
            // Create an array containing only the ids in alphabetical order
            let rideIdCollection = Array.from(rides, x => x.id.split('_')[1]);

            async.each(rides, function (ride, callback) {
                let ride_id = ride.id.split('_')[1]

                // Create the matrix that will be used to store the duration of the walk between two rides
                let destinations = [];
                let walkTimeMatrixModel = rideIdCollection.slice(rideIdCollection.indexOf(ride_id)+1, rideIdCollection.length);
                let walkTimeMatrix = {};

                // Fill the destinations arrays with rides coordinates, to be used in the Google Maps API request
                for (id of walkTimeMatrixModel) {
                    walkTimeMatrix[id] = null
                    destinations.push({
                        lat: ridesData[id].coordinates[0],
                        lng: ridesData[id].coordinates[1]
                    })
                }

                // Make request to the Google Maps API
                Companion.getWalkTime([ridesData[ride_id].coordinates], destinations).then(function(response) {
                    // Fill the matrix
                    if (response.status === 200) {
                        for (row of response.json.rows) {
                            for (element_index in row.elements) {
                                walkTimeMatrix[walkTimeMatrixModel[element_index]] = row.elements[element_index].duration.value
                            }
                        }
                    }
                    
                    // Create the destination from the Mongoose Model
                    Companion.Ride.create({
                        _id: ride_id,
                        name: ride.name,
                        infos: {
                            park: ride.id.split('_')[1].substr(0, 2),
                            fastPass: ride.fastPass,
                            duration: ridesData[ride_id].duration,
                        },
                        walkTimeMatrix : walkTimeMatrix,
                        loc: {
                            coordinates: ridesData[ride_id].coordinates,
                        }
                    }, function (err, ride) {
                        // Callback when the ride is saved
                        if (err) console.log(err);
                        callback();
                    })
                }).catch(function(err) {
                    if (err) console.log(err);
                    callback();
                })
            }, function (err) {
                // Callback when all the rides are saved
                if (err) console.log(err);
                console.log('All Rides created');
                console.log('Closing connection');
                Companion.endConnection()
            })
        })
    })
})
