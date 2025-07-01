const { expect } = require('chai');
const tenantAuth = require('../middleware/tenantAuth');

describe('tenantAuth middleware', () => {
  it('should export requireAdminForCreate as array with correct middleware', () => {
    expect(tenantAuth.requireAdminForCreate).to.be.an('array');
    expect(tenantAuth.requireAdminForCreate.length).to.equal(2);
  });
  it('should export requireTenantOrAdminForPay as array with correct middleware', () => {
    expect(tenantAuth.requireTenantOrAdminForPay).to.be.an('array');
    expect(tenantAuth.requireTenantOrAdminForPay.length).to.equal(2);
  });
  it('should export requireTenantOrAdminForSummary as array with correct middleware', () => {
    expect(tenantAuth.requireTenantOrAdminForSummary).to.be.an('array');
    expect(tenantAuth.requireTenantOrAdminForSummary.length).to.equal(2);
  });
}); 