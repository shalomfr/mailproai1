const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emailconfig', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 MongoDB disconnected');
    });

    // Graceful shutdown for serverless (different approach)
    if (process.env.NODE_ENV !== 'production') {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('📊 MongoDB connection closed through app termination');
        process.exit(0);
      });
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // In serverless, don't exit process
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB; 