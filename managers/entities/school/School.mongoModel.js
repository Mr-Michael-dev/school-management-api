const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name:      { type: String, required: true, trim: true },
    address:   { type: String, required: true, trim: true },
    admins:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('School', schoolSchema);
