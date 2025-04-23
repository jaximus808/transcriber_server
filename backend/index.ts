import express from 'express';
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static('../frontend/dist'));
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

