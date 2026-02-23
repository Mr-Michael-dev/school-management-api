const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    email:       { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    school:      { type: mongoose.Schema.Types.ObjectId, ref: 'School',    required: true },
    classroom:   { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    enrolledAt:  { type: Date, default: Date.now },
    createdAt:   { type: Date, default: Date.now },
    updatedAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', studentSchema);
