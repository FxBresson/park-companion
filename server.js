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

        res.send(routes);
    });

    // Return all rides
    app.get('/rides', function (req, res) {
        Companion.Ride.find({}, function(err, ride){
            if (err) res.send(err);
            res.json(ride);
        });
    });

    // Return ride by id
    app.get('/ride/:id', function (req, res) {
        Companion.Ride.findById(req.params.id, function(err,ride){
            if (err) res.send(err);
            res.json(ride);
        });
    });

    // Return wait time by id of the ride
    app.get('/wait/:id', function (req, res) {
        Companion.Ride.findById(req.params.id, function(err,ride){
            if (err) res.send(err);
            res.json(ride.realTime.waitTime);
        });
    });

    // Return
    app.get('/rides/:lat/:long/:duration', function (req, res) {
        // Step 1 : en fonction de :lat et :long, on choppe l'attraction la plus proche de la position de l'utilisateur (je vais la nommer $nearest)
        // Cette partie la je vais m'en occuper je sais comment faire, pour l'instant toi pour tester, fais une requete sur un n'importe quel ID genre :
        var nearest = Companion.Ride.findById("P1AA00", function(err,ride){
            return ride;
        });

        // db.rides.find({ loc: { $near: { $geometry: { type: "Point",  coordinates: [ 48.873580, 2.774306 ] } } } }).limit(1)

        // Step 2 : obtenir toutes les attractions ou : Companion.config.timeMargin + realTime.waitTime + infos.duration <= :duration
        // Si possible faudrait trouver un moyen de le faire direct dans la requete, mais sinon faut recuperer toutes les attractions et faire le test a la main

        // Results
        var nearestRides = [];


        Companion.Ride.find({}, function(err, ride){
            if (err) console.log(err);

            // Step 2 : obtenir toutes les attractions où : Companion.config.timeMargin + realTime.waitTime + infos.duration <= :duration
            // Si possible faudrait trouver un moyen de le faire direct dans la requete, mais sinon faut recuperer toutes les attractions et faire le test a la main
            if ((Companion.config.timeMargin + ride.realTime.waitTime + ride.infos.duration) <= req.params.duration) {

                var maxWaltTime = req.params.duration - (Companion.config.timeMargin + ride.realTime.waitTime + ride.infos.duration);

                // Step 3 : on pose :duration - (Companion.config.timeMargin + realTime.waitTime + infos.duration) = $maxWaltTime
                // Il nous faut donc toutes les attractions où le temps de marche $nearest -> attraction est inférieur à $maxWaltTime
                // Ce temps peut etre trouvé dans la propriété walkTimeMatrix de l'attraction.
                // Le walkTimeMatrix contient tous les temps de marche (pour l'instant set a 10 normalement) de l'attraction vers les autres attractions dont l'ID est apres dans l'ordre alphabétique
                // c'est a dire :
                // si tu veux la distance P1DA06 -> P1NA16, il faut regarder dans le walkTimeMatrix de P1DA06 (car P1DA06 < P1NA16 dans l'ordre alphabétique)
                // par contre si tu veux la distance P1DA06 -> P1AA02, il faut regarder dans le walkTimeMatrix de P1AA02
                // Hésite pas a regarder dans la base de donnée pour comprendre la structure des objects walkTimeMatrix si c'est pas clair. J'ai aussi laissé le console.log quand tu init la database en executant initDataBaseThemeParks.js, ca sera peut etre plus facile pour se rendre compte
                var compare1 = nearest.id < ride.id : nearest.id ? ride.id;
                var compare2 = nearest.id > ride.id : ride.id ? nearest.id;

                if (compare1.walkTimeMatrix[compare2] < maxWaltTime) {
                    // Tableau des attractions à retouner
                    nearestRides.push(ride);
                }
            }
        });

        nearest.id
        ride.id

    });

})
