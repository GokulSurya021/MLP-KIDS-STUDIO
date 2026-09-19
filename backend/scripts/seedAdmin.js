require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create or update admin@mlpkids.com
    const adminEmail = 'admin@mlpkids.com';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Studio Administrator',
        email: adminEmail,
        phone: '9515651718',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Created admin account: admin@mlpkids.com (password: admin123)');
    } else {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('✅ Updated admin@mlpkids.com to role: admin');
    }

    // 2. Also ensure gokulsurya021@gmail.com has admin role if desired
    const gokulUser = await User.findOne({ email: 'gokulsurya021@gmail.com' });
    if (gokulUser) {
      gokulUser.role = 'admin';
      await gokulUser.save();
      console.log('✅ Granted admin role to gokulsurya021@gmail.com');
    }

    console.log('Admin seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
}

seedAdmin();
