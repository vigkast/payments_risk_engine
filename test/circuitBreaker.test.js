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
}); 