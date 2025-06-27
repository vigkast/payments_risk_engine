const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { findUser } = require('../services/userService');
const { SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = findUser(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Exclude password from token
  const { password: _, ...userData } = user;
  const token = jwt.sign(userData, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

module.exports = router; 