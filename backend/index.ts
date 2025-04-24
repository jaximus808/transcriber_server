import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes/route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// console.log(process.env.SESSION_SECRET)

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true for HTTPS
}));

app.use("/api", routes);

app.use(express.static('../frontend/dist'));
app.get('{*any}', (req, res) => {
  res.sendFile(path.resolve('../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
