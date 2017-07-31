const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Client = Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    services: [String],
});

module.exports= mongoose.model('Client', Client);
