# park-companion
Companion API for Disneyland Paris parks

## Copyright
Toothless & Marinesl

## URL de l'API
[Link](http://api.fxbresson.fr:3000/)

## Installation
Clone the repo and do `npm install`

## Fill the data base
Run `node initDataBaseThemParks.js` just once
You can use the software Mongotron to read the data base
Run `node getWaitTimes.js` periodically to fill the db with real wait time

## To use the API
Run `mongod`
Run `node server.js`

All the routes that you can use:
* '\/' -> GET all routes
* '/ride/:id?' -> GET a ride by its id
* '/wait/:id?' -> GET the wait time of a ride by its id
* '/rides/' -> GET every rides in the park and all their infos
* '/rides/?lat=:lat&lng=:lng&duration=:duration' -> GET all the rides that are possible to do in a certain :duration based on the geolocalisation of the user with the :lat (latitude) and the :lng (longitude)

## Thanks for using :-)
