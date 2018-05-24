const Companion = require('./Companion');

const express = require('express'),
    app = express(),
    port = process.env.PORT || 3000;

app.listen(port);

console.log('Serveur API en écoute sur le port ' + port);



/********************************************************************
 *  ROUTER
 ********************************************************************/
Companion.connect(function() {

    // Return all routes
    app.get('/', function (req, res) {
        var routes = [];

        app._router.stack.forEach(function(r) {
            if (r.route && r.route.path) {
                routes.push(r.route.path);
            }
        });

        res.json({ "available_routes": routes});
    });


    // Return all rides
    app.get('/rides', function (req, res) {
        Companion.Ride.find({}, function(err, rides){
            if (err) {
                return next(err);
            }

            // If there is no result
            if (!rides) {
                res.json({ "message": "No ride found in this park!" });
            }
            // There is a result
            else {
                res.json(rides);
            }
        });
    });


    // Return ride by id
    app.get('/ride/:id?', function (req, res, next) {

        // If there is not a parameter
        if (!req.params.id) {
            res.json({ "message": "You have forgot the parameter!" , "parameter": "ID of the ride" });
        }
        // There is a parameter
        else {
            Companion.Ride.findById(req.params.id, function(err,ride){
                if (err) {
                    return next(err);
                }

                // If there is no result
                if (!ride) {
                    res.json({ "message": "The parameter provided is not usable!" });
                }
                // There is a result
                else {
                    res.json(ride);
                }
            });
        }

    });


    // Return wait time by id of the ride
    app.get('/wait/:id?', function (req, res, next) {

        // If there is not a parameter
        if (!req.params.id) {
            res.json({ "message": "You have forgot the parameter!" , "parameter": "ID of the ride" });
        }
        // There is a parameter
        else {
            Companion.Ride.findById(req.params.id, function(err,ride){
                if (err) {
                    return next(err);
                }

                // If there is no result
                if (!ride) {
                    res.json({ "message": "The parameter provided is not usable!" });
                }
                // There is a result
                else {
                    res.json(ride.realTime.waitTime);
                }
            });
        }

    });


    // Return
    app.get('/rides/:lat?/:lng?/:duration?', function (req, res) {
        if (!req.params.lat || !req.params.lng || !req.params.duration) {
            res.json({ "message": "You have forgot a parameter!" ,
                        "parameter1": "latitude" ,
                        "parameter2": "longitude" ,
                        "parameter3": "duration" });
        }
        else {
            if (isNaN(req.params.lat)) {
                res.json({ "message": "The latitude is not a number!" });
            } else if (isNaN(req.params.lng)) {
                res.json({ "message": "The longitude is not a number!" });
            } else if (req.params.lat > 90 || req.params.lat < -90) {
                res.json({ "message": "The value of the latitude does not exist!" });
            } else if (req.params.lng > 180 || req.params.lng < -180) {
                res.json({ "message": "The value of the longitude does not exist!" });
            } else {
                // Step 1 : en fonction de :lat et :lng, on choppe l'attraction la plus proche de la position de l'utilisateur (je vais la nommer $nearest)

                var nearest = Companion.Ride.find(
                    { loc:
                        { $near:
                            { $geometry:
                                { type: "Point",
                                coordinates: [ req.params.lat, req.params.lng] }
                            }
                        }
                    }
                ).limit(1).then(function(nearest) {
                    // On récupère l'index 0 du tableau nearest retourné
                    nearest = nearest[0];

                    // Results
                    var nearestRides = [];

                    // Step 2 : obtenir toutes les attractions ou : Companion.config.timeMargin + realTime.waitTime + infos.duration <= :duration
                    // Si possible faudrait trouver un moyen de le faire direct dans la requete, mais sinon faut recuperer toutes les attractions et faire le test à la main

                    Companion.Ride.find({ "realTime.active": true }, function(err, rides){
                        if (err) console.log(err);

                        // If there is no result
                        if (!rides) {
                            res.json({ "message": "No ride found for the time provided!" });
                        } else {
                            for (ride of rides) {
                                // Step 2 : obtenir toutes les attractions où : Companion.config.timeMargin + realTime.waitTime + infos.duration <= :duration
                                // Si possible faudrait trouver un moyen de le faire direct dans la requete, mais sinon faut recuperer toutes les attractions et faire le test a la main
                                if ((Companion.config.timeMargin + ride.realTime.waitTime*60 + ride.infos.duration) <= req.params.duration*60) {

                                    let maxWaltTime = req.params.duration*60 - (Companion.config.timeMargin + ride.realTime.waitTime*60 + ride.infos.duration);

                                    // Step 3 : on pose :duration - (Companion.config.timeMargin + realTime.waitTime + infos.duration) = $maxWaltTime
                                    // Il nous faut donc toutes les attractions où le temps de marche $nearest -> attraction est inférieur à $maxWaltTime
                                    // Ce temps peut etre trouvé dans la propriété walkTimeMatrix de l'attraction.
                                    // Le walkTimeMatrix contient tous les temps de marche (pour l'instant set a 10 normalement) de l'attraction vers les autres attractions dont l'ID est apres dans l'ordre alphabétique
                                    // c'est a dire :
                                    // si tu veux la distance P1DA06 -> P1NA16, il faut regarder dans le walkTimeMatrix de P1DA06 (car P1DA06 < P1NA16 dans l'ordre alphabétique)
                                    // par contre si tu veux la distance P1DA06 -> P1AA02, il faut regarder dans le walkTimeMatrix de P1AA02
                                    // Hésite pas a regarder dans la base de donnée pour comprendre la structure des objects walkTimeMatrix si c'est pas clair. J'ai aussi laissé le console.log quand tu init la database en executant initDataBaseThemeParks.js, ca sera peut etre plus facile pour se rendre compte


                                    let from = (nearest.id < ride.id) ? nearest : ride;
                                    let to = (nearest.id < ride.id) ? ride : nearest;


                                    if (from.walkTimeMatrix[to.id] <= maxWaltTime) {
                                        // Tableau des attractions à retouner
                                        nearestRides.push(ride.name);
                                    }
                                }
                            }

                            res.json(nearestRides);
                        }


                    });
                })
            }
        }
    });

    app.get('*', function (req, res) {
        var routes = [];

        app._router.stack.forEach(function(r) {
            if (r.route && r.route.path) {
                routes.push(r.route.path);
            }
        });


        res.json({ "message": "The route does not exist!" ,
                    "available_routes": routes});
    });

})
