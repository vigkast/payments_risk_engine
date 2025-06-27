const axios = require('axios');

// Simple in-memory cache for LLM responses
const llmCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
  const cached = getCache(prompt);
  if (cached) {
    return cached;
  }
  try {
    const response = await axios.post('http://localhost:5005/generate', { prompt });
    const result = response.data.generated_text;
    setCache(prompt, result);
    return result;
  } catch (e) {
    return 'LLM service failed or unavailable.';
  }
}

exports.getRiskExplanation = async (factors, score) => {
  const prompt = `Explain why a transaction with score ${score} is risky based on: ${factors.join(', ')}`;
  return await callLLM(prompt);
};

exports.getTenantSummary = async (tenantName, stats) => {
  const prompt = `Summarize the recent payment activity for tenant '${tenantName}': ${JSON.stringify(stats)}`;
  return await callLLM(prompt);
};

exports.getCircuitBreakerSummary = async ({ prompt }) => {
  return await callLLM(prompt);
};
