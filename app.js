const express = require('express');
const app = express();
require('dotenv').config();
const fraudRoutes = require('./routes/fraudRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const circuitRoutes = require('./routes/circuitRoutes');
const authRoutes = require('./routes/authRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/fraud', fraudRoutes);
app.use('/tenants', tenantRoutes);
app.use('/circuit', circuitRoutes);

app.use(errorHandler);
app.use(notFoundHandler);

module.exports = app;
