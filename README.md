# Payment Risk Engine


# Environment Variables Setup

Before running the Node.js backend, create a copy of .env.example and rename it to `.env` file inside the and update the following variables.

  - `ENCRYPTION_KEY` must be exactly 32 characters.
  - `JWT_SECRET` should be a strong, random string.
  - `GROQ_API_KEY` is required to call groq llm service.
  - Adjust other values as needed for your environment.

## Setup from payment_risk_engine folder

```bash
npm install
node server.js
```

The Node.js app will run at `http://localhost:3000/` for all LLM explanations.

## Features

- Fraud scoring with open-source LLM (Hugging Face)
- Multi-tenant routing (Stripe/PayPal)
- Circuit breaker with retry logic