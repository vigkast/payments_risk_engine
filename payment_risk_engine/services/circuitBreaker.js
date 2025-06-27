const fs = require('fs');
const path = require('path');
const PERSIST_FILE = path.join(__dirname, '../data/circuit_state.json');

// Provider-specific circuit breaker state
const providers = ['stripe', 'paypal'];
let state = {};

function loadState() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(PERSIST_FILE, 'utf8'));
      state = data;
    }
  } catch (e) {
    // If file is corrupt or missing, start fresh
    state = {};
  }
}

function saveState() {
  try {
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    // Ignore write errors for now
  }
}

function initState() {
  providers.forEach(provider => {
    if (!state[provider]) {
      state[provider] = {
        failureCount: 0,
        circuitState: 'closed',
        lastFailureTime: null,
        cooldownTime: 30000,
        halfOpenTestInProgress: false,
        retryCounts: 0,
        transitions: [],
        paymentHistory: []
      };
    }
  });
}

// Load state from disk on startup
loadState();
initState();

const historyWindowMs = 10 * 60 * 1000; // 10 minutes

async function flakyProvider(provider) {
  // Simulate different flakiness per provider if desired
  return Math.random() < 0.7;
}

function recordPayment(provider, success, retries) {
  const s = state[provider];
  s.paymentHistory.push({ timestamp: Date.now(), success });
  s.retryCounts += retries;
  // Remove old entries
  while (s.paymentHistory.length && s.paymentHistory[0].timestamp < Date.now() - historyWindowMs) {
    s.paymentHistory.shift();
  }
  saveState();
}

function recordTransition(provider, newState) {
  const s = state[provider];
  s.transitions.push({ timestamp: Date.now(), newState });
  // Keep only last 100 transitions
  if (s.transitions.length > 100) s.transitions.shift();
  saveState();
}

exports.handlePayment = async (payment) => {
  const provider = payment.provider || 'stripe';
  const s = state[provider];
  const now = Date.now();

  if (s.circuitState === 'open') {
    const elapsed = now - s.lastFailureTime;
    if (elapsed < s.cooldownTime) {
      recordPayment(provider, false, 0);
      return { status: 'rejected', circuit: 'open', provider };
    } else {
      s.circuitState = 'half-open';
      s.halfOpenTestInProgress = false;
      recordTransition(provider, 'half-open');
    }
  }

  if (s.circuitState === 'half-open') {
    if (s.halfOpenTestInProgress) {
      return { status: 'rejected', circuit: 'half-open', provider };
    }
    s.halfOpenTestInProgress = true;
    for (let attempt = 0; attempt < 3; attempt++) {
      const success = await flakyProvider(provider);
      recordPayment(provider, success, attempt + 1);
      if (success) {
        s.failureCount = 0;
        s.circuitState = 'closed';
        s.halfOpenTestInProgress = false;
        recordTransition(provider, 'closed');
        saveState();
        return { status: 'success', attempt: attempt + 1, circuit: 'closed', provider };
      }
      await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
    }
    s.failureCount++;
    s.lastFailureTime = Date.now();
    s.circuitState = 'open';
    s.halfOpenTestInProgress = false;
    recordTransition(provider, 'open');
    saveState();
    return { status: 'failed', reason: 'half-open test failed, circuit re-opened', circuit: 'open', provider };
  }

  // Normal operation (circuit closed)
  for (let attempt = 0; attempt < 3; attempt++) {
    const success = await flakyProvider(provider);
    recordPayment(provider, success, attempt + 1);
    if (success) {
      s.failureCount = 0;
      saveState();
      return { status: 'success', attempt: attempt + 1, circuit: 'closed', provider };
    }
    await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
  }

  s.failureCount++;
  s.lastFailureTime = Date.now();
  if (s.failureCount >= 5) {
    s.circuitState = 'open';
    recordTransition(provider, 'open');
  }
  recordPayment(provider, false, 3);
  saveState();
  return { status: 'failed', reason: 'all retries failed', circuit: s.circuitState, provider };
};

exports.getStatus = () => {
  const result = {};
  providers.forEach(provider => {
    const s = state[provider];
    const now = Date.now();
    const recent = s.paymentHistory.filter(e => e.timestamp > now - historyWindowMs);
    const total = recent.length;
    const failures = recent.filter(e => !e.success).length;
    const failureRate = total ? Math.round((failures / total) * 100) : 0;
    result[provider] = {
      circuitState: s.circuitState,
      failureCount: s.failureCount,
      lastFailure: s.lastFailureTime,
      recentAttempts: total,
      recentFailures: failures,
      failureRate,
      retryCounts: s.retryCounts,
      transitions: s.transitions.slice(-10)
    };
  });
  return result;
};

exports.getLLMSummaryPrompt = (provider = 'stripe') => {
  const status = exports.getStatus()[provider];
  return `In the last 10 minutes, ${status.failureRate}% of payment attempts failed for ${provider}. The circuit breaker is currently ${status.circuitState}, blocking new attempts if open.`;
};

exports.getMetrics = () => {
  const metrics = {};
  providers.forEach(provider => {
    const s = state[provider];
    metrics[provider] = {
      retryCounts: s.retryCounts,
      successCount: s.paymentHistory.filter(e => e.success).length,
      failureCount: s.paymentHistory.filter(e => !e.success).length,
      circuitState: s.circuitState,
      transitions: s.transitions.slice(-10)
    };
  });
  return metrics;
};
