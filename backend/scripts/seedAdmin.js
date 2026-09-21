require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const ownerEmail = (process.env.ADMIN_EMAIL || 'gokulsurya021@gmail.com').toLowerCase();

    // 1. Remove legacy admin accounts if any exist
    await User.deleteMany({ email: { $ne: ownerEmail }, role: 'admin' });

    // 2. Ensure only Gokul Surya has admin role
    const gokulUser = await User.findOne({ email: ownerEmail });
    if (gokulUser) {
      gokulUser.role = 'admin';
      await gokulUser.save();
      console.log(`✅ Granted admin role strictly to owner: ${ownerEmail}`);
    } else {
      console.log(`ℹ️ Owner account ${ownerEmail} will automatically receive admin privileges upon login/registration.`);
    }

    console.log('Admin security verification complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();
