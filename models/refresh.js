const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const RefreshToken = new Schema({
    u_id: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
});
module.exports= mongoose.model('RefreshToken', RefreshToken);