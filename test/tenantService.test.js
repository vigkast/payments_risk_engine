const { expect } = require('chai');
const tenantService = require('../services/tenantService');

describe('tenantService', () => {
  it('should create a tenant with encrypted keys', () => {
    const tenant = tenantService.createTenant({
      tenantId: 'tenantTest'+Math.round((Math.random(4)*1000)),
      stripeKey: 'sk_test_1234567890',
      paypalKey: 'pk_test_0987654321',
      preferredProcessor: 'stripe'
    });
    expect(tenant).to.have.property('response');
  });

  it('should process a payment for a valid tenant', async () => {
    tenantService.createTenant({
      tenantId: 'tenantPay',
      stripeKey: 'sk_test_abc',
      paypalKey: 'pk_test_xyz',
      preferredProcessor: 'stripe',
      email: 'abcd@fraud.net'
    });
    const result = await tenantService.processTenantPayment('tenantPay', {
      amount: 100,
      currency: 'USD',
      source: 'tok_test'
    });
    expect(result).to.have.property('status', 'success');
    expect(result).to.have.property('processor', 'stripe');
  });

  it('should throw error for invalid tenant', async () => {
    try {
      await tenantService.processTenantPayment('noTenant', {
        amount: 10,
        currency: 'USD',
        source: 'tok_test'
      });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.message).to.equal('Invalid tenant');
    }
  });

  it('should get tenant transactions', async () => {
    tenantService.createTenant({
      tenantId: 'tenantTrans',
      stripeKey: 'sk_test_abc',
      paypalKey: 'pk_test_xyz',
      preferredProcessor: 'stripe',
      email: 'abcd@fraud.net'
    });
    await tenantService.processTenantPayment('tenantTrans', {
      amount: 100,
      currency: 'USD',
      source: 'tok_test'
    });
    const txs = tenantService.getTenantTransactions('tenantTrans');
    expect(txs).to.be.an('array');
    expect(txs[0]).to.have.property('amount', 100);
  });

  it('should throw error for getTenantTransactions with invalid tenant', () => {
    expect(() => tenantService.getTenantTransactions('noTenant')).to.throw('Invalid tenant');
  });

}); 