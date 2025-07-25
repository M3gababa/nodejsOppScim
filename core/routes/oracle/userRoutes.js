const out = require('../logs');

const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');
const { getConnection, executeQuery } = require('../../utils/oracle_utils');

var router = require('express').Router();

// --- User Resource Endpoints ---
router.get('/', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);

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

router.get('/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const userId = req.params.id;
    try {
        if (userId) {
            out.logToFile(jsonResult);
            res.json(jsonResult);
        } else {
            out.log("WARNING", "GET", `User ${userId} not found`);
            res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404", detail: `User ${userId} not found` });
        }
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: `Error retrieving user ${userId}` });
    }
});

module.exports = router;