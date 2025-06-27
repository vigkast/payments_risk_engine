const router = require('express').Router();
const { createTenant, payForTenant, getTenantSummary } = require('../controllers/tenantController');
const { validate } = require('../middleware/validation');
const { requireAdminForCreate, requireTenantOrAdminForPay, requireTenantOrAdminForSummary } = require('../middleware/tenantAuth');

router.post('/', requireAdminForCreate, validate('createTenant'), createTenant);
router.post('/:tenantId/pay', requireTenantOrAdminForPay, validate('tenantId'), validate('tenantPayment'), payForTenant);
router.get('/:tenantId/summary', requireTenantOrAdminForSummary, validate('tenantId'), getTenantSummary);

module.exports = router;
