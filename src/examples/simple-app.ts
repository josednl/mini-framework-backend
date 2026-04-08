import { App } from '../index.js';

const app = new App();

// Simple logger middleware
app.use((req, res, next) => {
  // eslint-disable-next-line no-console
  console.log(`--> ${req.method} ${req.path}`);
  next();
});

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Mini TS Framework!' });
});

app.get('/users/:id', (req, res) => {
  const id = req.params['id'];
  res.json({ id, name: `User ${id}` });
});

app.post('/echo', (req, res) => {
  res.json({ received: req.body });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0');
console.log(`Server is listening on http://localhost:${PORT}`);
