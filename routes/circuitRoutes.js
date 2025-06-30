const router = require('express').Router();
const { getStatusSummary, processPayment, getCircuitBreakerSummary, getMetrics } = require('../controllers/circuitController');
const { validate } = require('../middleware/validation');

router.get('/summary', getStatusSummary);
router.post('/pay', validate('circuitPayment'), processPayment);
router.get('/llm-summary', getCircuitBreakerSummary);
router.get('/metrics', getMetrics);

module.exports = router;
