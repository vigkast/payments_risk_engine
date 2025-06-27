// In-memory cache for storing IP and device fingerprint history
const ipHistory = new Map();
const deviceHistory = new Map();
const transactionHistory = [];

// Configuration
const MAX_IP_ATTEMPTS = 5; // Max attempts from same IP in 24 hours
const MAX_DEVICE_ATTEMPTS = 3; // Max attempts from same device in 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function isExpired(timestamp) {
  return Date.now() - timestamp > CACHE_TTL;
}

function cleanExpiredEntries() {
  const now = Date.now();
  
  // Clean expired IP entries
  for (const [ip, data] of ipHistory.entries()) {
    if (isExpired(data.timestamp)) {
      ipHistory.delete(ip);
    }
  }
  
  // Clean expired device entries
  for (const [device, data] of deviceHistory.entries()) {
    if (isExpired(data.timestamp)) {
      deviceHistory.delete(device);
    }
  }
}

function checkRepeatIP(ip) {
  cleanExpiredEntries();
  
  if (!ipHistory.has(ip)) {
    ipHistory.set(ip, { count: 1, timestamp: Date.now() });
    return { isRepeat: false, count: 1 };
  }
  
  const data = ipHistory.get(ip);
  if (isExpired(data.timestamp)) {
    ipHistory.set(ip, { count: 1, timestamp: Date.now() });
    return { isRepeat: false, count: 1 };
  }
  
  data.count++;
  ipHistory.set(ip, data);
  
  return { 
    isRepeat: data.count > 1, 
    count: data.count,
    isExcessive: data.count > MAX_IP_ATTEMPTS 
  };
}

function checkRepeatDevice(deviceFingerprint) {
  cleanExpiredEntries();
  
  if (!deviceHistory.has(deviceFingerprint)) {
    deviceHistory.set(deviceFingerprint, { count: 1, timestamp: Date.now() });
    return { isRepeat: false, count: 1 };
  }
  
  const data = deviceHistory.get(deviceFingerprint);
  if (isExpired(data.timestamp)) {
    deviceHistory.set(deviceFingerprint, { count: 1, timestamp: Date.now() });
    return { isRepeat: false, count: 1 };
  }
  
  data.count++;
  deviceHistory.set(deviceFingerprint, data);
  
  return { 
    isRepeat: data.count > 1, 
    count: data.count,
    isExcessive: data.count > MAX_DEVICE_ATTEMPTS 
  };
}

function calculateRiskScore(transaction) {
  let score = 0;
  const riskFactors = [];
  
  // Check email domain
  if (transaction.email.endsWith('.ru') || transaction.email.includes('fraud.net')) {
    score += 0.4;
    riskFactors.push("flagged email domain");
  }
  
  // Check transaction amount
  if (transaction.amount > 1000) {
    score += 0.3;
    riskFactors.push("large transaction amount");
  }
  
  // Check repeat IP
  const ipCheck = checkRepeatIP(transaction.ip);
  if (ipCheck.isExcessive) {
    score += 0.3;
    riskFactors.push(`excessive attempts from IP (${ipCheck.count} attempts)`);
  } else if (ipCheck.isRepeat) {
    score += 0.2;
    riskFactors.push(`repeat IP address (${ipCheck.count} attempts)`);
  }
  
  // Check repeat device fingerprint
  const deviceCheck = checkRepeatDevice(transaction.deviceFingerprint);
  if (deviceCheck.isExcessive) {
    score += 0.3;
    riskFactors.push(`excessive attempts from device (${deviceCheck.count} attempts)`);
  } else if (deviceCheck.isRepeat) {
    score += 0.2;
    riskFactors.push(`repeat device fingerprint (${deviceCheck.count} attempts)`);
  }
  
  // Store transaction history
  transactionHistory.push({
    ...transaction,
    score,
    riskFactors,
    timestamp: Date.now()
  });
  
  // Keep only last 1000 transactions
  if (transactionHistory.length > 1000) {
    transactionHistory.shift();
  }
  
  return { score, riskFactors };
}

function getFraudStats() {
  const total = transactionHistory.length;
  const highRisk = transactionHistory.filter(t => t.score > 0.7).length;
  const moderateRisk = transactionHistory.filter(t => t.score > 0.4 && t.score <= 0.7).length;
  const lowRisk = transactionHistory.filter(t => t.score <= 0.4).length;
  
  return {
    totalEvaluated: total,
    highRisk,
    moderateRisk,
    lowRisk,
    uniqueIPs: ipHistory.size,
    uniqueDevices: deviceHistory.size
  };
}

module.exports = {
  calculateRiskScore,
  getFraudStats,
  checkRepeatIP,
  checkRepeatDevice
}; 