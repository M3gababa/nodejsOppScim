const express = require('express');
const bodyParser = require('body-parser');
const out = require('./core/logs');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// --- Default Endpoints ---
app.get('/', (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);   
    let txt = "&#9940; This is not suitable for PRODUCTION &#9940; <br/>";
    res.send(txt);
});

app.get('/scim/', (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    let txt = "&#9940; This is not suitable for PRODUCTION &#9940; <br/>";
    txt += "This aims to be a test for the BANNER database import and is not suitable for PRODUCTION.<br/>";
    txt += "This endpoint specify that this is a SCIM connector";
    res.send(txt);
});

// --- SCIM Endpoints ---
const scimRoutes = require('./core/scimRoutes');
app.use('/scim/v2', scimRoutes);

app.listen(port, () => {
    out.log("INFO", "START", "Service Started");
    console.log(`SCIM 2.0 Server listening on port ${port} with Oracle DB`);
});