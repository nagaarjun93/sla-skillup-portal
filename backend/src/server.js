require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB Atlas / Local Database
connectDB();

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

