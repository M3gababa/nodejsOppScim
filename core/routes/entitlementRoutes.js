const out = require('../logs');

const dbUtils = require('../../utils/sqlite_utils');
const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');

var router = require('express').Router();

// --- Entitlement Resource Endpoints ---
router.get('/', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    try {
        // TODO : Add Pagination
        const queryEntlt = `SELECT
            * 
        FROM
            ENTITLEMENT
        `;

        const entltList = await dbUtils.executeSql(queryEntlt);

        const userQuery = `SELECT
            U.id AS user_pk_id,
            U.email AS user_pk_email
        FROM
            USER U
        JOIN
            ENTITLEMENT_MEMBERSHIP EM ON U.id = EM.user_id
        JOIN
            ENTITLEMENT E ON EM.entitlement_id = E.id
        WHERE
            E.id = ?
        `;
        
        const entitlements = [];

        for (const row of entltList) {
            const members = await dbUtils.executeSql(userQuery, row.id);
            entitlements.push(scimUtils.createScimEntitlementFromTableRow(row, members));
        };
        
        const jsonResult = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            totalResults: entitlements.length,
            Resources: entitlements
        };
        
        out.logToFile(jsonResult);
        res.json(jsonResult);
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: 'Error retrieving entitlements' });
    }
});

router.get('/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const entltId = req.params.id;

    try {        
        const queryEntlt = `SELECT
            * 
        FROM
            ENTITLEMENT
        WHERE
            ID = ?
        `;

        const entltResult = await dbUtils.executeSql(queryEntlt, entltId, true);

        const userQuery = `SELECT
            U.id AS user_pk_id,
            U.email AS user_pk_email
        FROM
            USER U
        JOIN
            ENTITLEMENT_MEMBERSHIP EM ON U.id = EM.user_id
        JOIN
            ENTITLEMENT E ON EM.entitlement_id = E.id
        WHERE
            E.id = ?
        `;

        if (entltResult) {
            const members = await dbUtils.executeSql(userQuery, entltId);
            const jsonResult = scimUtils.createScimEntitlementFromTableRow(entltResult, members);
            out.logToFile(jsonResult);
            res.json(jsonResult);
        } else {
            out.log("WARNING", "GET", `Group ${entltId} not found`);
            res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404", detail: `Entitlement ${entltId} not found` });
        }
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: `Error retrieving entitlement ${entltId}` });
    }
});

module.exports = router;