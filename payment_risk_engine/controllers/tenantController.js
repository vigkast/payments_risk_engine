const tenantService = require('../services/tenantService');

exports.createTenant = (req, res) => {
  const config = tenantService.createTenant(req.body);
  res.status(201).json(config);
};

exports.payForTenant = (req, res) => {
  const result = tenantService.processTenantPayment(req.params.tenantId, req.body);
  res.json(result);
};

exports.getTenantSummary = async (req, res) => {
  // Mock stats for demonstration; replace with real stats aggregation
  const stats = {
    payments: 124,
    successRate: 98,
    highRisk: 2,
    processor: 'PayPal'
  };
  const summary = await require('../services/llmService').getTenantSummary(req.params.tenantId, stats);
  res.json({ summary });
};
