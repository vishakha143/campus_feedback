const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Material = require('./models/Material');
require('dotenv').config(); 
async function seedMaterials() {
  try {
    await connectDB();
    await Material.deleteMany({}); // Clear existing materials
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
    console.error('Error seeding materials:', err);
    mongoose.connection.close();
  }
}

seedMaterials();