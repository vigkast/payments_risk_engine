const router = require('express').Router();
const { evaluateRisk, getFraudStats } = require('../controllers/fraudController');
const { validate } = require('../middleware/validation');

router.post('/evaluate-risk', validate('evaluateRisk'), evaluateRisk);
router.get('/fraud-stats', getFraudStats);

module.exports = router;
