const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { findUser } = require('../services/userService');
const tenantService = require('../services/tenantService');
const { SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Try admin first
  const user = findUser(username);
  if (user && user.password === password) {
    const { password: _, ...userData } = user;
    const token = jwt.sign(userData, SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  // Try tenant
  const tenant = tenantService.authenticateTenant(username, password);
  if (tenant) {
    const { password: _, ...tenantData } = tenant;
    const token = jwt.sign({ ...tenantData, role: 'tenant', tenantId: tenant.tenantId }, SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;