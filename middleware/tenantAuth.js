const { authenticateJWT, authorizeRole, authorizeTenant } = require('./auth');

// Only admin can create tenants
const requireAdminForCreate = [authenticateJWT, authorizeRole('admin')];

// Only admin or associated viewer can pay for a tenant
const requireTenantOrAdminForPay = [authenticateJWT, authorizeTenant()];

// Only admin or associated viewer can view tenant summary
const requireTenantOrAdminForSummary = [authenticateJWT, authorizeTenant()];

module.exports = {
  requireAdminForCreate,
  requireTenantOrAdminForPay,
  requireTenantOrAdminForSummary
}; 