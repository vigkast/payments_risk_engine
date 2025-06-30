const { getRiskExplanation } = require('../services/llmService');
const { calculateRiskScore, getFraudStats } = require('../services/fraudDetectionService');

exports.evaluateRisk = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Missing request body' });
    }
    const { amount, currency, ip, deviceFingerprint, email } = req.body;
    const { score, riskFactors } = calculateRiskScore({
      amount,
      currency,
      ip,
      deviceFingerprint,
      email
    });
    const riskLevel = score > 0.7 ? 'high' : score > 0.4 ? 'moderate' : 'low';
    const explanation = await getRiskExplanation(riskFactors, score);
    res.json({ score, riskLevel, explanation });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
};

exports.getFraudStats = (req, res) => {
  try {
    const stats = getFraudStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
