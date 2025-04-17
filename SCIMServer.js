const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
let out = require('./core/logs');

// const { getConnection, executeQuery } = require('./core/oracle_db'); // Import the functions
const { getConnection, executeQuery } = require('./core/postgre_db'); // Import the functions
const { createScimUserFromTableRow, createScimGroupFromTableRow } = require('./core/scim_utils');

const app = express();
const port = 3000;

app.use(bodyParser.json());

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

app.get('/scim/v2/', (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);

    let txt = "&#9940; This is not suitable for PRODUCTION &#9940; </br>";
    txt += "This aims to be a test for the BANNER database import and is not suitable for PRODUCTION.<br/>";
    txt += "This endpoint specify that this is a SCIM connector <br/>";
    txt += "This endpoint specify that this is based on SCIM V2.0 model";
    res.send(txt);
});

// --- Service Provider Config Endpoint ---
app.get('/scim/v2/ServiceProviderConfig', (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);

    res.json({
            "schemas":[
              "urn:scim:schemas:core:2.0",
              "urn:okta:schemas:scim:providerconfig:2.0"
            ],
            "documentationUrl":"/",
            "patch":{
              "supported":false
            },
            "bulk":{
              "supported":false
            },
            "filter":{
              "supported":false
            },
            "changePassword":{
              "supported":true
            },
            "sort":{
              "supported":false
            },
            "etag":{
              "supported":false
            },
            "authenticationSchemes":[
            ],
            "urn:okta:schemas:scim:providerconfig:2.0": {
            "userManagementCapabilities": [
                "IMPORT_NEW_USERS",
                "IMPORT_PROFILE_UPDATES",
            ]
        }
    });
});


// --- User Resource Endpoints ---

// 1. Get All Users
app.get('/scim/v2/Users', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);

    let connection;
    try {
        connection = await getConnection();
        
        const query = `SELECT BID, CN, DN, DESCRIPTION, ESSECADLOGIN, ESSECBID, ESSECCAMPUS, ESSECCSN, ESSECMAIL, ESSECMFAACTIVE, ESSECNOMNAISS, ESSECPRENOMNAISS, ESSECPEGASEID, GIVENNAME, INITIALS, IPPHONE, MAIL, NAME, PERSONALMAIL, SN, USERPASSWORD, PRIMARYEMAIL, FIRSTNAME, LASTNAME, ORGUNITPATH, ALIASMAIL FROM COMPTES;`;
        const users = result.rows.map(row => createScimUserFromTableRow(row));
        
        const jsonResult = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            totalResults: users.length,
            Resources: users
        };

        out.logToFile(jsonResult);
        res.json(jsonResult);
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: 'Error retrieving users' });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 2. Get User by ID
app.get('/scim/v2/Users/:id', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);

    const userId = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT BID, CN, DN, DESCRIPTION, ESSECADLOGIN, ESSECBID, ESSECCAMPUS, ESSECCSN, ESSECMAIL, ESSECMFAACTIVE, ESSECNOMNAISS, ESSECPRENOMNAISS, ESSECPEGASEID, GIVENNAME, INITIALS, IPPHONE, MAIL, NAME, PERSONALMAIL, SN, USERPASSWORD, PRIMARYEMAIL, FIRSTNAME, LASTNAME, ORGUNITPATH, ALIASMAIL FROM COMPTES WHERE BID = :id`;       
        const result = await executeQuery(connection, query, [userId]);
        
        if (result.rows.length > 0) {
            const jsonResult = createScimUserFromTableRow(result[0]);
            out.logToFile(jsonResult);
            res.json(jsonResult);
        } else {
            out.log("WARNING", "GET", `User ${userId} not found`);
            res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404", detail: `User ${userId} not found` });
        }
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: `Error retrieving user ${userId}` });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// --- Group Resource Endpoints ---

// 1. Get All Groups
app.get('/scim/v2/Groups', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);

    let connection;
    try {
        connection = await getConnection();
        const query = `select distinct group_id, groupe, description from groupes`;
        const result = await executeQuery(connection, query);
        const groups = result.rows.map(row => createScimGroupFromTableRow(row));

        const jsonResult = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            totalResults: groups.length,
            Resources: groups
        };

        out.logToFile(jsonResult);
        res.json(jsonResult);
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: 'Error retrieving groups' });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// 2. Get Group by ID
app.get('/scim/v2/Groups/:id', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);

    const groupId = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const query = `select distinct group_id, groupe, description from groupes WHERE id = :id`;
        const result = await executeQuery(connection, query, [groupId]);
        if (result.rows.length > 0) {
            const jsonResult = createScimGroupFromTableRow(result[0]);
            out.log(jsonResult);
            res.json(jsonResult);
        } else {
            out.log("WARNING", "GET", `Group ${groupId} not found`);
            res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404", detail: `Group ${groupId} not found` });
        }
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: `Error retrieving group ${groupId}` });
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.listen(port, () => {
    out.log("INFO", "START", "Service Started");
    console.log(`SCIM 2.0 Server listening on port ${port} with Oracle DB`);
});