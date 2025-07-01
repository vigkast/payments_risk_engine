const { expect } = require('chai');
const circuitBreaker = require('../services/circuitBreaker');

describe('circuitBreaker', () => {
  it('should process a payment and return success or failure', async () => {
    const result = await circuitBreaker.handlePayment({ provider: 'stripe', amount: 100 });
    expect(result).to.have.property('status');
    expect(result).to.have.property('provider', 'stripe');
  });

  it('should track circuit state for both providers', async () => {
    await circuitBreaker.handlePayment({ provider: 'stripe', amount: 10 });
    await circuitBreaker.handlePayment({ provider: 'paypal', amount: 10 });
    const status = circuitBreaker.getStatus();
    expect(status).to.have.property('stripe');
    expect(status).to.have.property('paypal');
    expect(status.stripe).to.have.property('circuitState');
    expect(status.paypal).to.have.property('circuitState');
  });

  it('should return metrics for both providers', () => {
    const metrics = circuitBreaker.getMetrics();
    expect(metrics).to.have.property('stripe');
    expect(metrics).to.have.property('paypal');
    expect(metrics.stripe).to.have.property('retryCounts');
    expect(metrics.paypal).to.have.property('retryCounts');
  });

  it('should not throw when calling saveState and initState', () => {
    expect(() => circuitBreaker.saveState()).to.not.throw();
    expect(() => circuitBreaker.initState()).to.not.throw();
  });

  it('should record a payment and update retryCounts', () => {
    const before = circuitBreaker.getStatus().stripe.retryCounts;
    circuitBreaker.recordPayment('stripe', true, 2);
    const after = circuitBreaker.getStatus().stripe.retryCounts;
    expect(after).to.be.at.least(before);
  });

  it('flakyProvider should return a boolean', async () => {
    const result = await circuitBreaker.flakyProvider('stripe');
    expect(result).to.be.a('boolean');
  });
}); 