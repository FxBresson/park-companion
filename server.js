const Companion = require('./Companion');
const RateLimit = require('express-rate-limit');
const express = require('express'),
    app = express(),
    port = process.env.PORT || 3000;

const rateLimiter = new RateLimit({
    windowMs: 1000, // 1 minutes
    max: 1, // limit each IP to 1 requests per windowMs
    delayMs: 0 // disable delaying - full speed until the max limit is reached
});

function generateLinks(req, id) {
    return [
        {
            rel: "self",
            href: req.protocol + '://' + req.get('host') + '/ride/' + id
        },
        {
            rel: "list",
            href: req.protocol + '://' + req.get('host') + '/rides'
        },
        {
            rel: "waitTime",
            href: req.protocol + '://' + req.get('host') + '/wait/' + id
        }
    ]
}



/********************************************************************
 *  ROUTER
 ********************************************************************/
Companion.connect(function() {


    /**
     * GET a ride by :id
     */
    app.get('/ride/:id?', function (req, res, next) {

        // If the parameter is missing
        if (!req.params.id) {
            res.status(400).json({ "message": "You have forgot the parameter!" , "parameter": "ID of the ride" });
        }
        else {
            Companion.Ride.findById(req.params.id, function(err,ride){
                if (err) { return next(err); }

                // No result found
                if (!ride) {
                    res.status(400).json({ "message": "The parameter provided is not usable!" });
                }
                // Return the result
                else {
                    ride.set('links', generateLinks(req, ride.id), { strict: false })
                    res.json(ride);
                }
            });
        }

    });


    /**
     * GET the wait time of a ride by :id
     */
    app.get('/wait/:id?', function (req, res, next) {

        // If the parameter is missing
        if (!req.params.id) {
            res.status(400).json({ "message": "You have forgot the parameter!" , "parameter": "ID of the ride" });
        }
        else {
            Companion.Ride.findById(req.params.id, function(err,ride){
                if (err) { return next(err); }

                // No result found
                if (!ride) {
                    res.status(404).json({ "message": "The parameter provided is not usable!" });
                }
                // Return the result
                else {
                    res.json(ride.realTime.waitTime);
                }
            });
        }

    });



    /**
     * GET all rides
     * GET rides by :latitude :longitude :duration
     */
    app.get('/rides/', function (req, res, next) {
        // If all parameters are missing
        // GET all rides
        if (!req.query.lat && !req.query.lng && !req.query.duration) {
            Companion.Ride.find({}, function(err, rides){
                if (err) { return next(err); }

                // No result found
                if (!rides) {
                    res.status(404).json({ "message": "No ride found in this park!" });
                }
                // Return the result
                else {
                    for (ride of rides) {
                        ride.set('links', generateLinks(req, ride.id), { strict: false })
                    }
                    res.json(rides);
                }
            });
        }

        // If one of the parameters is missing
        else if (!req.query.lat || !req.query.lng || !req.query.duration) {
            res.status(400).json({ "message": "You have forgot a parameter!" ,
                        "parameter1": "latitude" ,
                        "parameter2": "longitude" ,
                        "parameter3": "duration" });
        }

        // GET rides by :latitude :longitude :duration
        else {
            // If :lat is not a number
            if (isNaN(req.query.lat)) {
                res.status(400).json({ "message": "The latitude is not a number!" });
            } else if (isNaN(req.query.lng)) {
                res.status(400).json({ "message": "The longitude is not a number!" });
            } else if (req.query.lat > 90 || req.query.lat < -90) {
                res.status(400).json({ "message": "The value of the latitude does not exist!" });
            } else if (req.query.lng > 180 || req.query.lng < -180) {
                res.status(400).json({ "message": "The value of the longitude does not exist!" });
            } else {

                // On récupère l'attraction la plus proche de la position de l'utilisateur
                var nearest = Companion.Ride.find(
                    { loc:
                        { $near:
                            { $geometry:
                                { type: "Point",
                                coordinates: [ req.query.lat, req.query.lng] }
                            }
                        }
                    }
                    // "_id": {
                    //     $in: ["P1", "P2"]
                    // }
                ).then(function(destination) {
                    if (destination.length) {
                        Companion.Ride.find(
                            { loc:
                                { $near:
                                    { $geometry:
                                        { type: "Point",
                                        coordinates: [ req.query.lat, req.query.lng] }
                                    }
                                }
                            }
                        ).limit(1).then(function(nearest) {
                            // On récupère l'index 0 du tableau nearest retourné
                            nearest = nearest[0];

                            // Results
                            var nearestRides = [];

                            // On récupère les rides actives
                            Companion.Ride.find({ "realTime.active": true }, function(err, rides){
                                if (err) console.log(err);

                                // No result found
                                if (!rides) {
                                    res.json({ "message": "No ride found for the time provided!" });
                                } else {
                                    for (ride of rides) {

                                        // On calcule le temps d'attente de l'attraction + sa durée + plus une marge de temps de 5min
                                        // Le temps waitTime est converti en secondes
                                        var timeForRide = Companion.config.timeMargin + ride.realTime.waitTime * 60 + ride.infos.duration;

                                        // Le paramètre :duration de l'utilisateur est converti en secondes
                                        var userDurationSecond = req.query.duration * 60;

                                        // Si le temps pour faire l'attraction est inférieur au temps entré par l'utilisateur
                                        if (timeToRide <= userDurationSecond) {

                                            // On calcule le temps de marche maximum nécessaire pour aller jusqu'à l'attraction
                                            let maxWaltTime = userDurationSecond - timeForRide;

                                            // On récupère les id des attractions de départ et d'arrivée, par ordre alphabétique
                                            // nearest : attraction la plus proche (voir au-dessus)
                                            // ride : attraction courente (boucle)
                                            let from = (nearest.id < ride.id) ? nearest : ride;
                                            let to = (nearest.id < ride.id) ? ride : nearest;

                                            // On récupère le temps de marche entre l'attraction from à l'attraction to
                                            // Si ce temps est inférieur ou égal au temps de marche nécessaire pour aller jusqu'à l'attraction
                                            // On l'ajoute dans le tableau de résultats
                                            if (from.walkTimeMatrix[to.id] <= maxWaltTime) {
                                                // Tableau des attractions à retourner
                                                nearestRides.push(ride.name);
                                            }
                                        }
                                    }
                                    // Return the result
                                    res.json(nearestRides);
                                }
                            });
                        })
                    } else {
                        res.status(400).json({ "message": "You're not in a Disneyland Paris Park !" });
                    }
                })
            }
        }
    });

    /**
     * GET every routes non created and render a message
     */
    app.get('*', function (req, res) {
        var routes = [];

        app._router.stack.forEach(function(r) {
            if (r.route && r.route.path) {
                routes.push(r.route.path);
            }
        });

        routes.push("/rides/?lat=:lat&lng=:lng&duration=:duration");

        res.status(404).json({ "message": "The route does not exist!" ,
                    "available_routes": routes});
    });



    /**
     * GET all the routes created
     */
    app.get('/', function (req, res) {
        var routes = [];

        app._router.stack.forEach(function(r) {
            if (r.route && r.route.path) {
                routes.push(r.route.path);
            }
        });

        routes.push("/rides/?lat=:lat&lng=:lng&duration=:duration");

        res.status(404).json({ "available_routes": routes});
    });


    app.use(rateLimiter)
    app.listen(port);
    console.log('Serveur API en écoute sur le port ' + port);
});
