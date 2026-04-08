# AGENTS.md - AI Agent Collaboration Guide

This document provides the necessary context and design rules for AI agents to collaborate effectively on **mini-framework-backend**.

## Project Objective

A minimalist backend micro-framework built with TypeScript and Node.js native `http` module. The goal is to maintain a simple API similar to Express, but without heavy external dependencies.

## System Architecture

### Core Components (`src/framework.ts`)
- **App**: Main class that manages the server, middlewares, and routes.
- **Router**: Handles route registration and path matching (including dynamic parameters like `:param`).
- **HttpRequest / HttpResponse**: Interfaces that wrap Node.js native requests and responses to provide a friendlier API (`res.json()`, `res.status()`, etc.).

### Request Lifecycle
1. Request arrives at the HTTP server.
2. Body is parsed asynchronously.
3. Global middlewares execute in order.
4. Router searches for a matching route.
5. Route handler executes (or 404 if no match).

## Development Rules for Agents

### Code Style and Typing
- **Strict TypeScript**: Always define types for parameters and returns. Use `HttpRequest`, `HttpResponse` interfaces and the `Middleware` type.
- **Async/Await**: The framework supports async middlewares. Prefer `async/await` over raw Promises.
- **No Dependencies**: Avoid adding external libraries unless strictly necessary. Lightweight is the goal.

### File Structure
- `src/framework.ts`: Core framework logic.
- `src/index.ts`: Entry point that exports public functionality.
- `src/examples/`: Example applications for testing and demonstration.

### Error Handling
- Middlewares should catch their own errors or let the global `App` wrapper handle them (responds with 500).
- Do not use `console.log` in the core framework; use the middleware system for logging (see example in `src/examples/simple-app.ts`).

## Testing Changes

To validate changes, it is recommended to:
1. Create a file in `src/examples/`.
2. Run with `tsx` or compile with `tsc`.
3. Make requests using `curl` or similar tools.

## Roadmap for Agents

If asked to expand the framework, consider:
- Adding CORS support.
- Implementing a sub-router system (nested Router).
- Improving complex body parsing (multipart/form-data).
- Adding schema validation (optional integration with Zod).
