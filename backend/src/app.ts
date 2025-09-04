import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import userRoutes from './routes/userRoutes';
import rsvpRoutes from './routes/rsvpRoutes';
import categoryRoutes from './routes/categoryRoutes';
import otherRoutes from './routes/otherRoutes';
import adminRoutes from './routes/adminRoutes';
import swaggerSpec from './config/swagger';
import logger from './utils/logger';
import { globalErrorHandler } from './utils/errorHandler';
import { DB_URI, PORT } from "./utils/secrets";
import passport from 'passport';
import cookieParser from 'cookie-parser';


const app = express();
app.use(passport.initialize());
app.use(express.json());
app.use(cookieParser());
app.use(cors(
  {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }
));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/rsvps', rsvpRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', otherRoutes);


// Global error handler
app.use(globalErrorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(`404 - Route Not Found - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
})