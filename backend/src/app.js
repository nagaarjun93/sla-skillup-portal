const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const examRoutes = require('./routes/examRoutes');
const mockTestRoutes = require('./routes/mockTestRoutes');
const weeklyTestRoutes = require('./routes/weeklyTestRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    message: 'SLA SkillUp / NMA Backend API is running smoothly',
    timestamp: new Date()
  });
});

// Routes
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', examRoutes);
app.use('/api', mockTestRoutes);
app.use('/api', weeklyTestRoutes);

// Serve built admin-web React application at /admin
const fs = require('fs');
const adminWebDist = path.join(__dirname, '../../admin-web/dist');
if (fs.existsSync(adminWebDist)) {
  app.use('/admin', express.static(adminWebDist));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminWebDist, 'index.html'));
  });
}

// Root route fallback
app.get('/', (req, res) => {
  res.send('SLA SkillUp / NMA Aptitude Portal Backend API');
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
