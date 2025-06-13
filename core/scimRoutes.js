const fs = require('fs');
const out = require('./logs');
const auth = require('basic-auth');

const { getConnection, executeQuery } = require('./oracle_db');
const { createScimUserFromTableRow, createScimGroupFromTableRow } = require('./scim_utils');

var router = require('express').Router();

//  Define your user credentials (in a real application, use a database)
// TODO : Clean Up
const creds = {
    'login': 'scimUser',
    'pwd': 'P@ssw0rd123!',
};

const authenticate = (req, res, next) => {
    const user = auth(req);
    
    if (!user || creds.login !== user.name || creds.pwd !== user.pass) {
        res.setHeader('WWW-Authenticate', 'Basic realm="My Realm"');
        res.status(401).send({ error: 'Authentication required' });
    } else {
        req.user = user;
        next();
    }
};

router.get('/', (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    let txt = "&#9940; This is not suitable for PRODUCTION &#9940; </br>";
    txt += "This aims to be a test for the BANNER database import and is not suitable for PRODUCTION.<br/>";
    txt += "This endpoint specify that this is a SCIM connector <br/>";
    txt += "This endpoint specify that this is based on SCIM V2.0 model";
    res.send(txt);
});

// --- Service Provider Config Endpoints ---
router.get('/ServiceProviderConfig', (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    res.json(JSON.parse(fs.readFileSync('./scim/serviceProviderConfig.json', 'utf8')));
});

router.get('/ResourceTypes', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const jsonResourceTypes = JSON.parse(fs.readFileSync('./scim/resourceTypes.json', 'utf8'));
    const jsonResult = {
        "schemas": [
            "urn:ietf:params:scim:api:messages:2.0:ListResponse"
        ],
        "totalResults": jsonResourceTypes.length,
        "Resources": jsonResourceTypes
    }
    
    res.json(jsonResult);
});

router.get('/ResourceTypes/:id', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const attrId = req.params.id;
    const jsonResourceTypes = JSON.parse(fs.readFileSync('./scim/resourceTypes.json', 'utf8'));
    const resourceType = jsonResourceTypes.find(obj => obj.id===attrId);
    
    res.json(resourceType);
});

router.get('/Schemas', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const jsonSchema = JSON.parse(fs.readFileSync('./scim/schemas.json', 'utf8'));
    const jsonResult = {
        "schemas": [
            "urn:ietf:params:scim:api:messages:2.0:ListResponse"
        ],
        "totalResults": jsonSchema.length,
        "Resources": jsonSchema
    }
    
    res.json(jsonResult);
});

router.get('/Schemas/:id', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const attrId = req.params.id;
    const jsonSchema = JSON.parse(fs.readFileSync('./scim/schemas.json', 'utf8'));
    
    const attributeSpec = jsonSchema.find(obj => obj.id===attrId);
    
    res.json(attributeSpec);
});

// --- User Resource Endpoints ---
router.get('/Users', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    let connection;
    try {
        connection = await getConnection();
        
        // TODO : Pagination
        const query = `SELECT * FROM COMPTES`;
        const result = await executeQuery(connection, query);
        
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

router.get('/Users/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const userId = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        const query = `SELECT * FROM COMPTES WHERE id = :id`;
        const result = await executeQuery(connection, query, [userId]);
        
        if (result.rows.length > 0) {
            const jsonResult = createScimUserFromTableRow(result.rows[0]);
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
router.get('/Groups', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    let connection;
    try {
        connection = await getConnection();

        // TODO : Add Pagination
        const query = `select * from GROUPES`;
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

router.get('/Groups/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const groupId = req.params.id;
    let connection;
    try {
        connection = await getConnection();
        
        const query = `select * from groupes WHERE id = :id`;
        const result = await executeQuery(connection, query, [groupId]);
        if (result.rows.length > 0) {
            const jsonResult = createScimGroupFromTableRow(result.rows[0]);
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

module.exports = router;