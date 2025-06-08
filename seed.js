require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Material = require('./models/Material');

async function seedData() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in the .env file');
    }

    await connectDB();

    // Seed Users
    await User.deleteMany({});

    const users = [
      { username: 'Ambika', email: 'ambika@example.com', role: 'teacher', password: 'password123' },
      { username: 'Vishakha', email: 'vishakha@example.com', role: 'student', password: 'password123' },
      { username: 'Sakshi', email: 'sakshi@example.com', role: 'admin', password: 'password123' },
      { username: 'Sunidhi', email: 'sunidhi@example.com', role: 'student', password: 'password123' }
    ];

    for (const userData of users) {
      await User.register(
        {
          username: userData.username,
          email: userData.email,
          role: userData.role
        },
        userData.password
      );
      console.log(`User ${userData.username} seeded successfully.`);
    }

    console.log('Sample users inserted.');

    // Seed Materials
    await Material.deleteMany({});
    await Material.insertMany([
      {
        title: 'Introduction to Algebra',
        description: 'A comprehensive guide to basic algebra concepts.',
        type: 'pdf',
        url: 'https://example.com/algebra.pdf',
        createdAt: new Date()
      },
      {
        title: 'Physics Lecture Notes',
        description: 'Notes from the latest physics lecture.',
        type: 'text',
        content: 'This lecture covers Newton’s laws of motion...',
        createdAt: new Date()
      },
      {
        title: 'Chemistry Video Tutorial',
        type: 'link',
        url: 'https://example.com/chemistry-video',
        createdAt: new Date()
      }
    ]);
    console.log('Sample materials inserted.');

    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding data:', err);
    mongoose.connection.close();
  }
}

seedData();