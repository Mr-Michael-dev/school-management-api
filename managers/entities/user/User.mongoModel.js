const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema({
    username:  { type: String, required: true, unique: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    role:      { type: String, enum: ['superadmin', 'school_admin'], default: 'school_admin' },
    school:    { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
    createdAt: { type: Date, default: Date.now },
});

// Auto-hash password before insert or save — fires on .create() and .save()
// Does NOT fire on findOneAndUpdate(); hash manually if updating password that way
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Usage in manager: const match = await user.comparePassword(plaintext)
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
