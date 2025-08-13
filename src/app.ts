import express from 'express';
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
app.use('/api', routes);

export default app;
