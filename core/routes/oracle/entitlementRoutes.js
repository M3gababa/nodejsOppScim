const out = require('../logs');

const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');
const { getConnection, executeQuery } = require('../../utils/oracle_utils');

var router = require('express').Router();

// --- Entitlement Resource Endpoints ---
router.get('/', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    // TODO
    try {
        const jsonResult = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            totalResults: entitlements.length,
            Resources: entitlements
        };
        
        res.json(jsonResult);
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: 'Error retrieving entitlements' });
    }
});

router.get('/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const entltId = req.params.id;

    // TODO
    try {        
         if (entltId) {
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