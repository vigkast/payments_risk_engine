const { expect } = require('chai');
const tenantService = require('../services/tenantService');

describe('tenantService', () => {
  it('should create a tenant with encrypted keys', () => {
    const tenant = tenantService.createTenant({
      tenantId: 'tenantTest',
      stripeKey: 'sk_test_1234567890',
      paypalKey: 'pk_test_0987654321',
      preferredProcessor: 'stripe'
    });
    expect(tenant).to.have.property('stripeKey');
    expect(tenant).to.have.property('paypalKey');
    expect(tenant.stripeKey).to.not.equal('sk_test_1234567890');
    expect(tenant.paypalKey).to.not.equal('pk_test_0987654321');
  });

  it('should process a payment for a valid tenant', () => {
    tenantService.createTenant({
      tenantId: 'tenantPay',
      stripeKey: 'sk_test_abc',
      paypalKey: 'pk_test_xyz',
      preferredProcessor: 'stripe'
    });
    const result = tenantService.processTenantPayment('tenantPay', {
      amount: 100,
      currency: 'USD',
      source: 'tok_test'
    });
    expect(result).to.have.property('status', 'success');
    expect(result).to.have.property('processor', 'stripe');
  });

  it('should throw error for invalid tenant', () => {
    expect(() => tenantService.processTenantPayment('noTenant', {
      amount: 10,
      currency: 'USD',
      source: 'tok_test'
    })).to.throw('Invalid tenant');
  });
}); 