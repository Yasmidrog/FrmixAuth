const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const token = new Schema({
    u_id: {type: Schema.Types.ObjectId, ref: "User", required:true},
    token: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    date: String,
    type: String,
    createdAt: {type: Date, expires: 60 * 60 * 3, default: Date.now}
});
module.exports = mongoose.model('Token', token);
