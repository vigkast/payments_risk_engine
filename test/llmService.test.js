const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const llmService = require('../services/llmService');

describe('llmService', () => {
  let postStub;
  beforeEach(() => {
    postStub = sinon.stub(axios, 'post').resolves({data:{choices:[{message:{content: 'mocked LLM response' } }]}});
  });
  afterEach(() => {
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

describe('llmService - multiple provider fallback', () => {
  let postStub;
  process.env.OPENAI_API_KEY = 'test-key';
  beforeEach(() => {
    postStub = sinon.stub(axios, 'post');
  });
  afterEach(() => {
    postStub.restore();
  });

  it('should fallback to OpenAI if primary LLM provider fails', async () => {
    // First call (primary) fails, second call (OpenAI) succeeds
    postStub.onFirstCall().rejects({});
    postStub.onSecondCall().resolves({ data: { choices: [ { message: { content: 'openai fallback response' } } ] } });
    const result = await llmService.getRiskExplanation(['flagged email domain1'], 0.8);
    expect(result).to.include('openai fallback response');
    expect(postStub.callCount).to.equal(2);
  });

  it('should throw a 503 error if both providers fail', async () => {
    // Both calls fail
    postStub.onFirstCall().rejects({});
    postStub.onSecondCall().rejects({});
    try {
      await llmService.getRiskExplanation(['flagged email domain2'], 0.8);
      throw new Error('Should have thrown');
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.status).to.equal(503);
      expect(err.message).to.include('LLM service failed or unavailable');
    }
    expect(postStub.callCount).to.equal(2);
  });
}); 