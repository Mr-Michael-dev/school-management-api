const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name:      { type: String, required: true, trim: true },
    school:    { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    capacity:  { type: Number, default: null },
    resources: [{ type: String, trim: true }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Classroom', classroomSchema);
