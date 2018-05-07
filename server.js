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
    app.get('/get/rides', function (req, res) {
        Companion.Ride.find({}, function(err, ride){
            if (err) res.send(err);
            res.json(ride);
        });
    });

    // Return ride by id
    app.get('/get/ride/:id', function (req, res) {
        Companion.Ride.findById(req.params.id, function(err,ride){
            if (err) res.send(err);
            res.json(ride);
        });
    });

})