var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LoginSchema = new mongoose.Schema({
    ip: String,
    status: Number,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

mongoose.model('Login', LoginSchema);