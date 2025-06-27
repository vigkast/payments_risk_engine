const { expect } = require('chai');
const { schemas } = require('../middleware/validation');

describe('validation middleware', () => {
  it('should validate a correct evaluateRisk payload', () => {
    const payload = {
      amount: 100,
      currency: 'USD',
      ip: '127.0.0.1',
      deviceFingerprint: 'abc123',
      email: 'test@example.com'
    };
    const { error } = schemas.evaluateRisk.validate(payload);
    expect(error).to.be.undefined;
  });

  it('should fail for missing required fields', () => {
    const payload = { amount: 100 };
    const { error } = schemas.evaluateRisk.validate(payload);
    expect(error).to.not.be.undefined;
    expect(error.details.map(d => d.message)).to.include('Currency is required');
  });

  it('should fail for invalid email', () => {
    const payload = {
      amount: 100,
      currency: 'USD',
      ip: '127.0.0.1',
      deviceFingerprint: 'abc123',
      email: 'not-an-email'
    };
    const { error } = schemas.evaluateRisk.validate(payload);
    expect(error).to.not.be.undefined;
    expect(error.details.map(d => d.message)).to.include('Email must be a valid email address');
  });
}); 