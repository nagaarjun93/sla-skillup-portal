require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./src/models/Admin');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nma_aptitude', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Database connected for admin seeding...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin@123', salt);

    let admin = await Admin.findOne({ username: 'admin' });
    if (admin) {
      admin.password = hashedPassword;
      await admin.save();
      console.log('Admin user password updated to "admin@123".');
    } else {
      await Admin.create({ username: 'admin', password: hashedPassword });
      console.log('Admin created with username "admin" and password "admin@123".');
    }
  } catch (error) {
    console.log('Database seeding error:', error.message);
  } finally {
    process.exit(0);
  }
};

seedAdmin();
