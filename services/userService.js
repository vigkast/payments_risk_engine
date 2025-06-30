const users = [
  { id: 1, username: 'admin', password: 'adminpass', role: 'admin', tenantId: null }
];

exports.findUser = (username) => users.find(u => u.username === username); 