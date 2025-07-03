const crypto = require('crypto');
const tenants = {};
const fraudDetectionService = require('./fraudDetectionService');
const circuitBreaker = require('./circuitBreaker');

// Use ENCRYPTION_KEY from environment, must be 32 bytes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "QwErTyUiOpAsDfGhJkLzXcVbNm123456";
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be set in .env and be exactly 32 characters long');
}
const IV_LENGTH = 16;

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let parts = text.split(':');
  let iv = Buffer.from(parts.shift(), 'hex');
  let encryptedText = Buffer.from(parts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

exports.createTenant = ({ tenantId, stripeKey, paypalKey, preferredProcessor, email, username, password }) => {
  if(tenants[tenantId]){
    return { response: "Tenant already exists" };
  }
  tenants[tenantId] = {
    preferredProcessor,
    stripeKey: stripeKey ? encrypt(stripeKey) : undefined,
    paypalKey: paypalKey ? encrypt(paypalKey) : undefined,
    email,
    username,
    password,
    transactions: [] // In-memory transaction log
  };
  return { response: "Tenant created successfully" };
};

exports.authenticateTenant = (username, password) => {
  // Find tenant by username and password
  const found = Object.entries(tenants).find(([tenantId, tenant]) => tenant.username === username && tenant.password === password);
  if (found) {
    const [tenantId, tenant] = found;
    return { tenantId, ...tenant };
  }
  return null;
};

exports.processTenantPayment = async (tenantId, paymentData) => {
  const tenant = tenants[tenantId];
  if (!tenant) throw new Error("Invalid tenant");

  // Fetch tenant email and add to paymentData if not present
  if (!paymentData.email) {
    paymentData.email = tenant.email;
  }

  // Circuit breaker logic
  const provider = tenant.preferredProcessor;
  const status = circuitBreaker.getStatus()[provider];
  if (status.circuitState === 'open') {
    return { status: 'rejected', reason: 'circuit open', provider, tenantId, ...paymentData, timestamp: new Date().toISOString() };
  }
  // Simulate payment using circuit breaker (calls flakyProvider internally)
  const cbResult = await circuitBreaker.handlePayment({ provider, ...paymentData });
  if (cbResult.status !== 'success') {
    const failedResult = { status: 'failed', reason: cbResult.reason || 'payment failed', provider, tenantId, ...paymentData, timestamp: new Date().toISOString() };
    tenant.transactions.push(failedResult);
    if (tenant.transactions.length > 1000) {
      tenant.transactions.shift();
    }
    return failedResult;
  }

  // Calculate risk score and factors
  const riskResult = fraudDetectionService.calculateRiskScore(paymentData);
  const result = { status: "success", processor: provider, tenantId, ...paymentData, ...riskResult, timestamp: new Date().toISOString() };

  // Log transaction in-memory for this tenant
  tenant.transactions.push(result);
  // Keep only last 1000 transactions per tenant
  if (tenant.transactions.length > 1000) {
    tenant.transactions.shift();
  }
  return result;
};

exports.getTenantTransactions = (tenantId) => {
  const tenant = tenants[tenantId];
  if (!tenant) throw new Error("Invalid tenant");
  return tenant.transactions;
};
