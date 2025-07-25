const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const out = require('./core/logs');

const port = process.env.PORT || 3000;
const baseUrl = process.env.DOMAIN;

global.appRoot = path.resolve(__dirname);
global.urlRoot = baseUrl ? `https://${baseUrl}.vercel.app` : `http://localhost:${port}`;

// Define express app
const app = express();
app.use(bodyParser.json());

// --- SCIM Endpoints ---
const scimRoutes = require('./core/routes/scimRoutes');
app.use('/scim/v2', scimRoutes);

// Undefined endpoints
app.all('*', (req, res) => {
    out.log("INFO", req.method, "Got request: " + req.originalUrl);
    res.status(404).send("<h1>Page not found ! </h1><br> <h2>We're sorry, we couldn't find the page you requested.</h2>");
});

app.listen(port, () => {
    out.log("INFO", "START", `SCIM 2.0 Server listening on port ${port}`);
});