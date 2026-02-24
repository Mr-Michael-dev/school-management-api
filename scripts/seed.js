/**
 * Seed script — creates the first superadmin account.
 *
 * Usage:
 *   SEED_PASSWORD=yourpassword node scripts/seed.js
 *
 * Optional overrides:
 *   SEED_USERNAME=admin SEED_EMAIL=admin@school.com SEED_PASSWORD=yourpassword node scripts/seed.js
 *
 * The script is idempotent — if a superadmin already exists it exits without making changes.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../managers/entities/user/User.mongoModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/axion';

async function seed() {
    const password = process.env.SEED_PASSWORD;
    if (!password) {
        console.error('Error: SEED_PASSWORD is required.');
        console.error('Usage: SEED_PASSWORD=yourpassword node scripts/seed.js');
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log(`Connected to ${MONGO_URI}`);

    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
        console.log(`Superadmin already exists: ${existing.email}`);
        await mongoose.disconnect();
        process.exit(0);
    }

    const username = process.env.SEED_USERNAME || 'superadmin';
    const email    = process.env.SEED_EMAIL    || 'admin@school.com';

    const user = await User.create({ username, email, password, role: 'superadmin' });

    console.log('Superadmin created successfully:');
    console.log(`  Username : ${user.username}`);
    console.log(`  Email    : ${user.email}`);
    console.log(`  Role     : ${user.role}`);
    console.log('\nYou can now log in via POST /api/user/login');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
