# Payment Risk Engine

A Node.js backend for multi-tenant payment risk assessment, circuit breaker logic, and LLM-powered explanations.

## Environment Variables Setup

Before running the backend, create a `.env` file in the project root. You can start by copying `.env.example` (create this file if it doesn't exist) and updating the following variables:

- `ENCRYPTION_KEY` (required, exactly 32 characters): Used for tenant credential encryption.
- `JWT_SECRET` (required): Secret for JWT signing.
- `GROQ_API_KEY`: API key for Groq LLM service.
- `GROQ_MODEL`: (optional) Model name for Groq (default: llama3-8b-8192).
- `GROQ_URL` or `LLM_SERVER_URL`: URL for the primary LLM provider.
- `OPENAI_API_KEY`: API key for OpenAI fallback.
- `OPENAI_MODEL`: (optional) Model name for OpenAI (default: gpt-3.5-turbo).
- `OPENAI_URL`: (optional) URL for OpenAI API (default: https://api.openai.com/v1/chat/completions).
- `FAILURE_COUNT`: (default: 3) Number of consecutive failures before opening the circuit breaker.
- `STRIPE_FLAKINESS`: (default: 0.7) Probability of Stripe payment success.
- `PAYPAL_FLAKINESS`: (default: 0.5) Probability of PayPal payment success.
- `HISTORY_WINDOW_MS`: (default: 600000) Time window for circuit breaker stats (ms).
- `CACHE_TTL`: (default: 600000) LLM response cache time (ms).
- `MAX_IP_ATTEMPTS`: (default: 5) Max attempts from same IP in 10 minutes.
- `MAX_DEVICE_ATTEMPTS`: (default: 3) Max attempts from same device in 10 minutes.

## Setup

```bash
npm install
node server.js
```

The app will run at `http://localhost:3000/`.

## Features

- Multi-tenant payment routing (Stripe/PayPal)
- Circuit breaker with per-provider state and retry logic
- Fraud scoring with device/IP heuristics
- LLM-powered explanations and summaries (GROQ/OpenAI fallback)
- Tenant-based transaction logging and aggregation
- JWT-based authentication and authorization

## Running Tests

```bash
npm test
```

Unit tests are located in the `test/` directory and cover controllers, services, and middleware.