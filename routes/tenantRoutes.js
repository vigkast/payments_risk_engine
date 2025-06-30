const router = require('express').Router();
const { createTenant, payForTenant, getTenantSummary } = require('../controllers/tenantController');
const { validate } = require('../middleware/validation');
const { authenticateJWT, authorizeRole, authorizeTenant } = require('../middleware/auth');

router.post('/', authenticateJWT, authorizeRole('admin'), validate('createTenant'), createTenant);
router.post('/:tenantId/pay', authenticateJWT, authorizeTenant(), validate('tenantId'), validate('tenantPayment'), payForTenant);
router.get('/:tenantId/summary', authenticateJWT, authorizeTenant(), validate('tenantId'), getTenantSummary);

module.exports = router;
