const { getRiskExplanation } = require('../services/llmService');
const { calculateRiskScore, getFraudStats } = require('../services/fraudDetectionService');

exports.evaluateRisk = async (req, res) => {
  const { amount, currency, ip, deviceFingerprint, email } = req.body;

  // Use dynamic fraud detection service
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
};

exports.getFraudStats = (req, res) => {
  // Use real fraud stats from the detection service
  const stats = getFraudStats();
  res.json(stats);
};
