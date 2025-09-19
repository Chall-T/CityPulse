import express, { Request, Response, NextFunction } from 'express';
import path from "path";
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

import { generalLimiter } from './middleware/rateLimiter';

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

app.use(generalLimiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/rsvps', rsvpRoutes);
app.use('/categories', categoryRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use("/cache", express.static(path.join(process.cwd(), "images", "cache")));
app.use("/stock", express.static(path.join(process.cwd(), "images", "stock")));
app.use('/', otherRoutes);


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