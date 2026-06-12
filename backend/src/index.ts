import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/api';
import { rateLimiter } from './middleware/auth';
import { setCsrfToken, validateCsrfToken } from './middleware/csrf';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 1. HTTP Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://api.generativeai.google"]
    }
  }
}));

// 2. CORS configuration (allowing secure credential transfers like HTTP-Only cookies)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// 3. Request parsers and CSRF Middlewares
app.use(cookieParser());
app.use(express.json({ limit: '5mb' })); // Limit body sizes to prevent DoS attacks
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use(setCsrfToken);
app.use(validateCsrfToken);

// 4. API Rate Limiting
app.use('/api', rateLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// 5. Routing
app.use('/api', apiRouter);

// 6. Global Error Boundary Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Error boundary caught error:', err.message || err);

  // Return clean errors for Zod validation payload failures
  if (err.name === 'ZodError') {
    res.status(400).json({ error: 'Validation failed', details: err.errors });
    return;
  }

  // General server exception shielding
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message 
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  EcoTrack AI Enterprise Server Running`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
  });
}
export default app; // For integration testing
