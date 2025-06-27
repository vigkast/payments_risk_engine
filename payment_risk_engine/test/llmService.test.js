const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const llmService = require('../services/llmService');

describe('llmService', () => {
  let postStub;
  before(() => {
    postStub = sinon.stub(axios, 'post').resolves({ data: { generated_text: 'mocked LLM response' } });
  });
  after(() => {
    postStub.restore();
  });

  it('should get a risk explanation', async () => {
    const result = await llmService.getRiskExplanation(['flagged email domain'], 0.8);
    expect(result).to.include('mocked LLM response');
  });

  it('should get a tenant summary', async () => {
    const result = await llmService.getTenantSummary('tenantA', { payments: 10, successRate: 90, highRisk: 1, processor: 'stripe' });
    expect(result).to.include('mocked LLM response');
  });

  it('should get a circuit breaker summary', async () => {
    const result = await llmService.getCircuitBreakerSummary({ prompt: 'Summarize circuit breaker' });
    expect(result).to.include('mocked LLM response');
  });
}); 