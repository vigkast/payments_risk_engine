const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const circuitController = rewire('../controllers/circuitController');

describe('circuitController', () => {
  let circuitBreakerStub, llmServiceStub;
  beforeEach(() => {
    circuitBreakerStub = {
      getStatus: sinon.stub().returns({ stripe: { circuitState: 'closed' } }),
      handlePayment: sinon.stub().resolves({ status: 'success' }),
      getLLMSummaryPrompt: sinon.stub().returns('prompt'),
      getMetrics: sinon.stub().returns({ stripe: { retryCounts: 1 } })
    };
    llmServiceStub = { getCircuitBreakerSummary: sinon.stub().resolves('summary') };
    circuitController.__set__('circuitBreaker', circuitBreakerStub);
    circuitController.__set__('llmService', llmServiceStub);
  });
  afterEach(() => sinon.restore());

  const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    return res;
  };

  describe('processPayment', () => {
    it('should process payment and return result', async () => {
      const req = { body: { provider: 'stripe' } };
      const res = mockRes();
      await circuitController.processPayment(req, res);
      expect(res.json.calledWith({ status: 'success' })).to.be.true;
    });
    it('should reject if circuit is open', async () => {
      circuitBreakerStub.getStatus.returns({ stripe: { circuitState: 'open' } });
      const req = { body: { provider: 'stripe' } };
      const res = mockRes();
      await circuitController.processPayment(req, res);
      expect(res.status.calledWith(429)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('status', 'rejected');
    });
    it('should handle errors', async () => {
      circuitBreakerStub.handlePayment.rejects(new Error('fail'));
      const req = { body: { provider: 'stripe' } };
      const res = mockRes();
      await circuitController.processPayment(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });

  describe('getStatusSummary', () => {
    it('should return status summary', () => {
      const req = {};
      const res = mockRes();
      circuitController.getStatusSummary(req, res);
      expect(res.json.calledWith({ stripe: { circuitState: 'closed' } })).to.be.true;
    });
    it('should handle errors', () => {
      circuitBreakerStub.getStatus.throws(new Error('fail'));
      const req = {};
      const res = mockRes();
      circuitController.getStatusSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });

  describe('getCircuitBreakerSummary', () => {
    it('should return summary from llmService', async () => {
      const req = { query: { provider: 'stripe' } };
      const res = mockRes();
      await circuitController.getCircuitBreakerSummary(req, res);
      expect(res.json.calledWith({ summary: 'summary' })).to.be.true;
    });
    it('should handle errors', async () => {
      llmServiceStub.getCircuitBreakerSummary.rejects(new Error('fail'));
      const req = { query: { provider: 'stripe' } };
      const res = mockRes();
      await circuitController.getCircuitBreakerSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics', () => {
      const req = {};
      const res = mockRes();
      circuitController.getMetrics(req, res);
      expect(res.json.calledWith({ stripe: { retryCounts: 1 } })).to.be.true;
    });
    it('should handle errors', () => {
      circuitBreakerStub.getMetrics.throws(new Error('fail'));
      const req = {};
      const res = mockRes();
      circuitController.getMetrics(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });
}); 