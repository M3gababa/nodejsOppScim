const out = require('../logs');

const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');
const { getConnection, executeQuery } = require('../../utils/oracle_utils');

var router = require('express').Router();

// --- Group Resource Endpoints ---
router.get('', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
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

router.get('/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
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