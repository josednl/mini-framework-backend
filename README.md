# mini-framework-backend

A minimalist HTTP framework written in TypeScript that provides basic functionalities for creating web servers, including routing with route parameters, middleware, and HTTP request/response handling.

## Features

- Simple routing with support for route parameters (e.g: `/users/:id`)
- Middleware system for processing requests before reaching handlers
- Support for standard HTTP methods (GET, POST, PUT, DELETE, etc.)
- Automatic handling of JSON bodies and query string parsing
- Easy response construction with methods like `json()`, `send()` and `status()`

## Installation

```bash
npm install
```

## Basic Usage

```typescript
import { App } from './src/framework';

const app = new App();

// Example middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'John Doe' });
});

app.post('/users', (req, res) => {
  res.status(201).json(req.body);
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Included Example

Check the example in `src/examples/simple-app.ts` for a complete implementation.

## Available Scripts

- `npm run dev` - Starts the server in development mode with ts-node
- `npm run build` - Compiles the TypeScript code to JavaScript
- `npm start` - Executes the compiled version of the example

## License

MIT