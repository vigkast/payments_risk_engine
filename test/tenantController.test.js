const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const tenantController = rewire('../controllers/tenantController');

// Mocks
const mockRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('tenantController', () => {
  let tenantServiceStub, llmServiceStub;
  beforeEach(() => {
    tenantServiceStub = {
      createTenant: sinon.stub(),
      processTenantPayment: sinon.stub(),
      getTenantTransactions: sinon.stub()
    };
    llmServiceStub = {
      getTenantSummary: sinon.stub().resolves('summary')
    };
    // Replace requires with stubs
    tenantController.__set__('tenantService', tenantServiceStub);
    tenantController.__set__('llmService', llmServiceStub);
  });

  afterEach(() => sinon.restore());

  describe('createTenant', () => {
    it('should create tenant and return 201', () => {
      const req = { body: { foo: 'bar' } };
      const res = mockRes();
      tenantServiceStub.createTenant.returns({ response: 'ok' });
      tenantController.createTenant(req, res);
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ response: 'ok' })).to.be.true;
    });
    it('should handle errors', () => {
      const req = { body: {} };
      const res = mockRes();
      tenantServiceStub.createTenant.throws(new Error('fail'));
      tenantController.createTenant(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });

  describe('payForTenant', () => {
    it('should process payment and return result', () => {
      const req = { body: { amount: 1 }, params: { tenantId: 't1' }, ip: '1.2.3.4' };
      const res = mockRes();
      tenantServiceStub.processTenantPayment.returns({ status: 'success' });
      tenantController.payForTenant(req, res);
      expect(res.json.calledWith({ status: 'success' })).to.be.true;
    });
    it('should handle errors', () => {
      const req = { body: {}, params: { tenantId: 't1' }, ip: '1.2.3.4' };
      const res = mockRes();
      tenantServiceStub.processTenantPayment.throws(new Error('fail'));
      tenantController.payForTenant(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });

  describe('getTenantSummary', () => {
    it('should return summary from llmService', async () => {
      const req = { params: { tenantId: 't1' } };
      const res = mockRes();
      tenantServiceStub.getTenantTransactions.returns([{ status: 'success', score: 0.8, processor: 'stripe' }]);
      llmServiceStub.getTenantSummary.resolves('summary');
      await tenantController.getTenantSummary(req, res);
      expect(res.json.calledWith({ summary: 'summary' })).to.be.true;
    });
    it('should handle errors', async () => {
      const req = { params: { tenantId: 't1' } };
      const res = mockRes();
      tenantServiceStub.getTenantTransactions.throws(new Error('fail'));
      await tenantController.getTenantSummary(req, res);
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('error');
    });
  });
}); 