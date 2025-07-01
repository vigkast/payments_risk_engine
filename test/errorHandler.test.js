const { expect } = require('chai');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

describe('errorHandler middleware', () => {
  const mockRes = () => {
    const res = {};
    res.status = function(code) { this.statusCode = code; return this; };
    res.json = function(obj) { this.body = obj; return this; };
    return res;
  };
  it('should handle Joi errors', () => {
    const err = { isJoi: true, details: [{ message: 'fail' }] };
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('error', 'Validation failed');
  });
  it('should handle ValidationError', () => {
    const err = { name: 'ValidationError', message: 'fail' };
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.have.property('error', 'Validation failed');
  });
  it('should handle UnauthorizedError', () => {
    const err = { name: 'UnauthorizedError', message: 'fail' };
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).to.equal(401);
    expect(res.body).to.have.property('error', 'Unauthorized');
  });
  it('should handle Invalid tenant', () => {
    const err = { message: 'Invalid tenant' };
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).to.equal(404);
    expect(res.body).to.have.property('error', 'Tenant not found');
  });
  it('should handle default error', () => {
    const err = { message: 'fail' };
    const res = mockRes();
    errorHandler(err, {}, res, () => {});
    expect(res.statusCode).to.equal(500);
    expect(res.body).to.have.property('error', 'Internal server error');
  });
});

describe('notFoundHandler middleware', () => {
  it('should return 404 for unknown route', () => {
    const req = { method: 'GET', path: '/unknown' };
    const res = { status: function(code) { this.statusCode = code; return this; }, json: function(obj) { this.body = obj; return this; } };
    notFoundHandler(req, res);
    expect(res.statusCode).to.equal(404);
    expect(res.body).to.have.property('error', 'Route not found');
  });
}); 