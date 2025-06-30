const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { authenticateJWT, authorizeRole, authorizeTenant, SECRET } = require('../middleware/auth');

// Mock Express req/res/next
function mockReqRes(user) {
  return {
    req: { headers: {}, user, params: { tenantId: 'tenantA' } },
    res: { status: function(code) { this.statusCode = code; return this; }, json: function(obj) { this.body = obj; return this; } },
    next: function(err) { this.called = true; this.err = err; }
  };
}

describe('auth middleware', () => {
  it('should authenticate valid JWT', (done) => {
    const token = jwt.sign({ username: 'admin', role: 'admin' }, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    authenticateJWT(req, res, () => {
      expect(req.user).to.have.property('username', 'admin');
      done();
    });
  });

  it('should reject invalid JWT', (done) => {
    const req = { headers: { authorization: 'Bearer invalidtoken' } };
    const res = { status: (code) => { expect(code).to.equal(401); return { json: (obj) => { expect(obj).to.have.property('error'); done(); } }; } };
    authenticateJWT(req, res, () => {});
  });

  it('should authorize admin role', () => {
    const { req, res, next } = mockReqRes({ role: 'admin' });
    let called = false;
    authorizeRole('admin')(req, res, () => { called = true; });
    expect(called).to.be.true;
  });

  it('should reject insufficient role', () => {
    const { req, res, next } = mockReqRes({ role: 'viewer' });
    let called = false;
    res.status = (code) => { expect(code).to.equal(403); return { json: (obj) => { expect(obj).to.have.property('error'); called = true; } }; };
    authorizeRole('admin')(req, res, () => {});
    expect(called).to.be.true;
  });

  it('should authorize tenant association', () => {
    const { req, res, next } = mockReqRes({ role: 'viewer', tenantId: 'tenantA' });
    let called = false;
    authorizeTenant()(req, res, () => { called = true; });
    expect(called).to.be.true;
  });

  it('should reject tenant mismatch', () => {
    const { req, res, next } = mockReqRes({ role: 'viewer', tenantId: 'tenantB' });
    let called = false;
    res.status = (code) => { expect(code).to.equal(403); return { json: (obj) => { expect(obj).to.have.property('error'); called = true; } }; };
    authorizeTenant()(req, res, () => {});
    expect(called).to.be.true;
  });
}); 