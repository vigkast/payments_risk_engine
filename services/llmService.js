const axios = require('axios');

// Simple in-memory cache for LLM responses
const llmCache = new Map();
const CACHE_TTL = Number(process.env.CACHE_TTL) || 10 * 60 * 1000; // 10 minutes

function getCacheKey(prompt) {
  return prompt;
}

function setCache(key, value) {
  llmCache.set(key, { value, timestamp: Date.now() });
}

function getCache(key) {
  const entry = llmCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    llmCache.delete(key);
    return null;
  }
  return entry.value;
}

async function callOpenAI(prompt) {
  // Fallback to OpenAI API
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    if (!apiKey) throw new Error('OpenAI API key not set');
    const response = await axios.post(
      process.env.OPENAI_URL,
      {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant for payment risk and fraud explanations.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response?.data?.choices?.[0]?.message?.content;
  } catch (e) {
    const err = new Error('Both primary and OpenAI LLM services failed.');
    err.status = 503;
    throw err;
  }
}

async function callLLM(prompt) {
  const cacheKey = getCacheKey(prompt);
  console.log(prompt);
  const cached = getCache(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const apiKey = process.env.GROQ_API_KEY || "test";
    const model = process.env.GROQ_MODEL || 'llama3-8b-8192';
    const response = await axios.post(
     process.env.GROQ_URL,
      {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant for payment risk and fraud explanations.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const result = response?.data?.choices?.[0]?.message?.content;
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    // If primary LLM fails, fallback to OpenAI
    try {
      const result = await callOpenAI(prompt);
      setCache(cacheKey, result);
      return result;
    } catch (fallbackError) {
      // Add error handler logic for fallbackError
      if (fallbackError.response) {
        const status = fallbackError.response.status;
        const message = fallbackError.response.data?.error?.message || fallbackError.response.data?.error || fallbackError.message;
        const err = new Error(message);
        err.status = status;
        throw err;
      } else {
        const err = new Error('LLM service failed or unavailable.');
        err.status = 503;
        throw err;
      }
    }
  }
}

exports.getRiskExplanation = async (factors, score) => {
  const prompt = `Explain why a transaction with score ${score} is risky based on: ${factors.join(', ')}`;
  return await callLLM(prompt);
};

exports.getTenantSummary = async (tenantName, stats) => {
  const prompt = `With tenant '${tenantName}': and using thefollowing JSON stringified transaction stats generate a summary of the payment activity about the successrate and how risky are the transactions in 2-liner ${JSON.stringify(stats)}`;
  return await callLLM(prompt);
};

exports.getCircuitBreakerSummary = async ({ prompt }) => {
  return await callLLM(prompt);
};
