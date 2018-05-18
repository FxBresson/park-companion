//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var RideSchema = new Schema({
    _id: String,
    name: String,
    walkTimeMatrix : Schema.Types.Mixed,
    loc: {
        type: {type: String, default: 'Point'},
        coordinates: [Number]
    },
    infos: {
        park: String,
        fastPass: Boolean,
        duration: Number,
        geoloc: {
            lat: Number,
            long: Number
        },
    },
    realTime: {
        waitTime: Number,
        lastUpdate: Date,
        active: Boolean,
        status: String,
        schedule: {
            opening: Date,
            closing: Date,
            dayStatus: String
        }
    },
    waitTimesRecorded: Schema.Types.Mixed
});

// Compile model from schema
module.exports = mongoose.model('Ride', RideSchema);

/*

themeparks Ride object example : 

{ id: 'DisneylandParisMagicKingdom_P1AA00',
  name: 'Adventure Isle',
  active: true,
  waitTime: 0,
  fastPass: false,
  lastUpdate: 1525552160593,
  status: 'Operating',
  schedule: 
   { date: '2018-05-05',
     openingTime: '2018-05-05T10:00:00+02:00',
     closingTime: '2018-05-05T22:30:00+02:00',
     type: 'Operating' } }

*/
