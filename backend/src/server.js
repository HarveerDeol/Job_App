const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const jobsRoutes = require('./routes/jobsRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const usersRoutes = require('./routes/usersRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationsRoutes');
const puppeteurRoutes = require('./routes/puppeteurRoutes');
const stageRoutes = require('./routes/stageRoutes');
const latexRoutes =  require('./routes/latexRoutes.js')
const llmRoutes =  require('./routes/llmRoutes.js')
const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));


// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/html-to-pdf', puppeteurRoutes);
app.use('/api/latex', latexRoutes); 

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});



module.exports = app;
