const crypto = require('crypto');
const tenants = {};
const fraudDetectionService = require('./fraudDetectionService');

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
  for (const tenantId in tenants) {
    const tenant = tenants[tenantId];
    if (tenant.username === username && tenant.password === password) {
      return { tenantId, ...tenant };
    }
  }
  return null;
};

exports.processTenantPayment = (tenantId, paymentData) => {
  const tenant = tenants[tenantId];
  if (!tenant) throw new Error("Invalid tenant");

  // Fetch tenant email and add to paymentData if not present
  if (!paymentData.email) {
    paymentData.email = tenant.email;
  }

  // Calculate risk score and factors
  const riskResult = fraudDetectionService.calculateRiskScore(paymentData);

  let processor = tenant.preferredProcessor;
  let result;
  if (processor === 'stripe') {
    const stripeKey = tenant.stripeKey ? decrypt(tenant.stripeKey) : undefined;
    result = { status: "success", processor: "stripe", tenantId, ...paymentData, ...riskResult, timestamp: new Date().toISOString() };
  } else if (processor === 'paypal') {
    const paypalKey = tenant.paypalKey ? decrypt(tenant.paypalKey) : undefined;
    result = { status: "success", processor: "paypal", tenantId, ...paymentData, ...riskResult, timestamp: new Date().toISOString() };
  } else {
    result = { status: "failed", reason: "Unknown processor", tenantId, ...paymentData, ...riskResult, timestamp: new Date().toISOString() };
  }

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
