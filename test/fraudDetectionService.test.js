const { expect } = require('chai');
const fraudDetection = require('../services/fraudDetectionService');

describe('fraudDetectionService', () => {
  it('should score high risk for flagged email domain', () => {
    const { score, riskFactors } = fraudDetection.calculateRiskScore({
      amount: 100,
      currency: 'USD',
      ip: '1.2.3.4',
      deviceFingerprint: 'dev1',
      email: 'user@fraud.net'
    });
    expect(score).to.be.greaterThan(0.3);
    expect(riskFactors.join(' ')).to.include('flagged email domain');
  });

  it('should score higher for large transaction amount', () => {
    const { score } = fraudDetection.calculateRiskScore({
      amount: 5000,
      currency: 'USD',
      ip: '1.2.3.5',
      deviceFingerprint: 'dev2',
      email: 'user@example.com'
    });
    expect(score).to.be.greaterThan(0.2);
  });

  it('should detect repeat IPs', () => {
    fraudDetection.calculateRiskScore({
      amount: 10,
      currency: 'USD',
      ip: '5.5.5.5',
      deviceFingerprint: 'dev3',
      email: 'a@b.com'
    });
    const repeat = fraudDetection.checkRepeatIP('5.5.5.5');
    expect(repeat.isRepeat).to.be.true;
  });

  it('should detect repeat device fingerprints', () => {
    fraudDetection.calculateRiskScore({
      amount: 10,
      currency: 'USD',
      ip: '6.6.6.6',
      deviceFingerprint: 'dev4',
      email: 'a@b.com'
    });
    const repeat = fraudDetection.checkRepeatDevice('dev4');
    expect(repeat.isRepeat).to.be.true;
  });

  it('should return fraud stats', () => {
    const stats = fraudDetection.getFraudStats();
    expect(stats).to.have.property('totalEvaluated');
    expect(stats).to.have.property('highRisk');
    expect(stats).to.have.property('moderateRisk');
    expect(stats).to.have.property('lowRisk');
  });
}); 