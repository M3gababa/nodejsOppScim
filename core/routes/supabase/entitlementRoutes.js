const out = require('../../logs');

const dbUtils = require('../../utils/postgres_utils');
const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');

var router = require('express').Router();

// --- Entitlement Resource Endpoints ---
router.get('/', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    try {
        // TODO : Add Pagination
        const entltList = await dbUtils.getEntitlements();
        
        const entitlements = [];

        for (const row of entltList) {
            const memberList = await dbUtils.getUsersPerEntitlement(row.id);
            const members = memberList.map(entry => ({ "user_pk_id": entry.users.id, "user_pk_email": entry.users.email }));
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
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const entltId = req.params.id;

    try {        
        const entltResult = await dbUtils.getEntitlement(entltId);

        if (entltResult.length > 0) {
            const memberList = await dbUtils.getUsersPerEntitlement(entltId);
            const members = memberList.map(entry => ({ "user_pk_id": entry.users.id, "user_pk_email": entry.users.email }));
            const jsonResult = scimUtils.createScimEntitlementFromTableRow(entltResult[0], members);
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