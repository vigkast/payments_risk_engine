const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

function authorizeTenant() {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    if (req.user.tenantId && req.user.tenantId === req.params.tenantId) return next();
    return res.status(403).json({ error: 'Forbidden: tenant mismatch' });
  };
}

module.exports = { authenticateJWT, authorizeRole, authorizeTenant, SECRET }; 