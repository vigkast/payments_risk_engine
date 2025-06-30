const circuitBreaker = require('../services/circuitBreaker');
const llmService = require('../services/llmService');

exports.processPayment = async (req, res) => {
  try {
    const provider = req.body.provider || 'stripe';
    const status = circuitBreaker.getStatus()[provider];
    if (status.circuitState === 'open') {
      return res.status(429).json({ status: 'rejected', reason: 'circuit open', provider });
    }
    const result = await circuitBreaker.handlePayment(req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
};

exports.getStatusSummary = (req, res) => {
  try {
    res.json(circuitBreaker.getStatus());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
};

exports.getCircuitBreakerSummary = async (req, res) => {
  try {
    const provider = req.query.provider || 'stripe';
    const prompt = circuitBreaker.getLLMSummaryPrompt(provider);
    const summary = await llmService.getCircuitBreakerSummary({ prompt });
    res.json({ summary });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
};

exports.getMetrics = (req, res) => {
  try {
    res.json(circuitBreaker.getMetrics());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
};
