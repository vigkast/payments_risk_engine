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
     process.env.LLM_SERVER_URL,
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
    if (e.response) {
      const status = e.response.status;
      const message = e.response.data?.error?.message || e.response.data?.error || e.message;
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
