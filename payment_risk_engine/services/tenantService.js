const crypto = require('crypto');
const tenants = {};

// Encryption utilities
const ENCRYPTION_KEY = crypto.createHash('sha256').update('your-secret-key').digest(); // 32 bytes for aes-256
const IV_LENGTH = 16;

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let parts = text.split(':');
  let iv = Buffer.from(parts.shift(), 'hex');
  let encryptedText = Buffer.from(parts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

exports.createTenant = ({ tenantId, stripeKey, paypalKey, preferredProcessor }) => {
  tenants[tenantId] = {
    preferredProcessor,
    stripeKey: stripeKey ? encrypt(stripeKey) : undefined,
    paypalKey: paypalKey ? encrypt(paypalKey) : undefined
  };
  return tenants[tenantId];
};

exports.processTenantPayment = (tenantId, paymentData) => {
  const tenant = tenants[tenantId];
  if (!tenant) throw new Error("Invalid tenant");

  let processor = tenant.preferredProcessor;
  let result;
  if (processor === 'stripe') {
    const stripeKey = tenant.stripeKey ? decrypt(tenant.stripeKey) : undefined;
    // Use stripeKey as needed
    result = { status: "success", processor: "stripe", tenantId, ...paymentData, timestamp: new Date().toISOString() };
  } else if (processor === 'paypal') {
    const paypalKey = tenant.paypalKey ? decrypt(tenant.paypalKey) : undefined;
    // Use paypalKey as needed
    result = { status: "success", processor: "paypal", tenantId, ...paymentData, timestamp: new Date().toISOString() };
  } else {
    result = { status: "failed", reason: "Unknown processor", tenantId, ...paymentData, timestamp: new Date().toISOString() };
  }
  return result;
};
