# Payment Risk Engine

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


# Local LLM Service Setup

This project uses a local open-source LLM for explanations and summaries. You must run a Python microservice using Hugging Face Transformers.

## 1. Create venv and install Python dependencies from llmservice folder

```bash
python3 -m venv .venv
```

```bash
. .venv/bin/activate
```


```bash
pip install fastapi uvicorn transformers torch
```


## 2. Run the LLM server

```bash
python llm_server.py
```

The Node.js app will call this service at `http://localhost:5005/generate` for all LLM explanations.