import express from 'express';
import session from "express-session";
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: "lax",
      httpOnly: true,
    },
  })
);

app.use('/api', routes);

export default app;
