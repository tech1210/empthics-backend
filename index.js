import express from 'express';
import cors from 'cors';
import logger from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';

import errorHandler from './src/middlewares/errorHandler.js';

import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/user.js';
import adminRoutes from './src/routes/admin.js';

import { limiter } from './src/utils/index.js';
import connectToMongo from './src/db.js';
let PORT = process.env.PORT || 5000;
const app = express();

// Connect to DB
connectToMongo();

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(logger('dev'));
app.use(helmet());
app.use(compression());
app.use(limiter);

// Base route
app.get('/', (req, res) => {
  res.status(200).send('API Running...');
});

app.get('/health', (req, res) => {
  res.status(200).send('API Running...');
});

app.get('/testsec', (req, res) => {
  res.status(200).send(process.env);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all for undefined routes
app.use((req, res) => {
  console.log('API not found!!', req.path);
  res.status(404).json({
    status: 404,
    message: 'API not found',
    result: {
      method: req.method,
      reqPath: req.path,
    },
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
});
