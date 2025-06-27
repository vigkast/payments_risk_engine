const users = [
  { id: 1, username: 'admin', password: 'adminpass', role: 'admin', tenantId: null },
  { id: 2, username: 'alice', password: 'alicepass', role: 'viewer', tenantId: 'tenantA' },
  { id: 3, username: 'bob', password: 'bobpass', role: 'viewer', tenantId: 'tenantB' }
];

exports.findUser = (username) => users.find(u => u.username === username); 