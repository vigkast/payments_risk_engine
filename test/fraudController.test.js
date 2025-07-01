const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const fraudController = rewire('../controllers/fraudController');

describe('fraudController', () => {
  let llmServiceStub, fraudDetectionServiceStub;
  beforeEach(() => {
    llmServiceStub = { getRiskExplanation: sinon.stub().resolves('explanation') };
    fraudDetectionServiceStub = {
      calculateRiskScore: sinon.stub().returns({ score: 0.8, riskFactors: ['flagged'] }),
      getFraudStats: sinon.stub().returns({ total: 1 })
    };
    fraudController.__set__('getRiskExplanation', llmServiceStub.getRiskExplanation);
    fraudController.__set__('calculateRiskScore', fraudDetectionServiceStub.calculateRiskScore);
    fraudController.__set__('getFraudStats', fraudDetectionServiceStub.getFraudStats);
  });
  afterEach(() => sinon.restore());

  const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
  };

  describe('evaluateRisk', () => {
    it('should return risk score, level, and explanation', async () => {
      const req = { body: { amount: 1, currency: 'USD', ip: '1.2.3.4', email: 'a@b.com' } };
      const res = mockRes();
      await fraudController.evaluateRisk(req, res);
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.args[0][0]).to.have.property('score', 0.8);
      expect(res.json.args[0][0]).to.have.property('riskLevel', 'high');
      expect(res.json.args[0][0]).to.have.property('explanation', 'explanation');
    });
    it('should handle missing body', async () => {
      const req = {};
      const res = mockRes();
      await fraudController.evaluateRisk(req, res);
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
    it('should handle errors', async () => {
      const req = { body: { amount: 1 } };
      const res = mockRes();
      fraudController.__set__('calculateRiskScore', () => { throw new Error('fail'); });
      await fraudController.evaluateRisk(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });

  describe('getFraudStats', () => {
    it('should return stats', () => {
      const req = {};
      const res = mockRes();
      fraudController.getFraudStats(req, res);
      expect(res.json.calledWith({ total: 1 })).to.be.true;
    });
    it('should handle errors', () => {
      const req = {};
      const res = mockRes();
      fraudController.__set__('getFraudStats', () => { throw new Error('fail'); });
      fraudController.getFraudStats(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });
}); 