//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var DestinationSchema = new Schema({
    _id: String,
    name: String,
    boundingBox: [Number],
    loc: {
        type: {type: String, default: 'Point'},
        coordinates: { type: [Number],   default: [0,0] }
    },
    polygon: {
        type: {type: String, default: 'Polygon'},
        coordinates: { type: [[[Number]]],   default: [[[0,0]]] }
    }
});

DestinationSchema.index({loc: '2dsphere'});
DestinationSchema.index({polygon: '2dsphere'});

// Compile model from schema
module.exports = mongoose.model('Destination', DestinationSchema);

