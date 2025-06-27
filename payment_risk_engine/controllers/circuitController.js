const circuitBreaker = require('../services/circuitBreaker');
const llmService = require('../services/llmService');

exports.processPayment = async (req, res) => {
  // Route based on provider and circuit health
  const provider = req.body.provider || 'stripe';
  const status = circuitBreaker.getStatus()[provider];
  if (status.circuitState === 'open') {
    return res.json({ status: 'rejected', reason: 'circuit open', provider });
  }
  const result = await circuitBreaker.handlePayment(req.body);
  res.json(result);
};

exports.getStatusSummary = (req, res) => {
  res.json(circuitBreaker.getStatus());
};

exports.getCircuitBreakerSummary = async (req, res) => {
  // Support provider param for summary
  const provider = req.query.provider || 'stripe';
  const prompt = circuitBreaker.getLLMSummaryPrompt(provider);
  const summary = await llmService.getCircuitBreakerSummary({ prompt });
  res.json({ summary });
};

exports.getMetrics = (req, res) => {
  res.json(circuitBreaker.getMetrics());
};
