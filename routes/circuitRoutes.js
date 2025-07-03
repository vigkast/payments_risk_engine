const router = require('express').Router();
const { getStatusSummary, processPayment, getCircuitBreakerSummary, getMetrics } = require('../controllers/circuitController');

router.get('/summary', getStatusSummary);
router.get('/llm-summary', getCircuitBreakerSummary);
router.get('/metrics', getMetrics);

module.exports = router;
