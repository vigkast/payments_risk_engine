const tenantService = require('../services/tenantService');
const llmService = require('../services/llmService');

exports.createTenant = (req, res) => {
  try {
    const config = tenantService.createTenant(req.body);
    res.status(201).json(config);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
};

exports.payForTenant = (req, res) => {
  try {
    // Add remote address as 'ip' to payment data
    const paymentData = { ...req.body, ip: req.ip || req.connection?.remoteAddress };
    const result = tenantService.processTenantPayment(req.params.tenantId, paymentData);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
};

exports.getTenantSummary = async (req, res) => {
  try {
    // Use real transaction data for summary
    const transactions = tenantService.getTenantTransactions(req.params.tenantId);
    // Aggregate stats for LLM summary
    const stats = {
      payments: transactions.length,
      successRate: transactions.length > 0 ? Math.round(100 * transactions.filter(t => t.status === 'success').length / transactions.length) : 100,
      highRisk: transactions.filter(t => t.score > 0.7).length,
      processor: transactions.length > 0 ? transactions[0].processor : undefined,
      recent: transactions.slice(-5) // Optionally include recent transactions
    };
    const summary = await llmService.getTenantSummary(req.params.tenantId, stats);
    res.json({ summary });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
};
