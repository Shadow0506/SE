// Global test teardown
const mongoose = require('mongoose');

module.exports = async () => {
  // Close all MongoDB connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  // Close all remaining connections
  await Promise.all(
    mongoose.connections.map(connection => connection.close())
  );
};
