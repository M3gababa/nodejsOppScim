const out = require('../../logs');

const dbUtils = require('../../utils/postgres_utils');
const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');

var router = require('express').Router();

// --- User Resource Endpoints ---
router.get('/', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.baseUrl);

    // TODO : Pagination
    try {
        const userList = await dbUtils.getUsers();

        const users = [];

        for (const row of userList) {
            const groups = [];
            const entitlements = [];
            users.push(scimUtils.createScimUserFromTableRow(row, groups, entitlements));
        };
        
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
    }
});

router.get('/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const userId = req.params.id;
    try {
        const userResult = await dbUtils.getUser(userId);

        console.log(userResult);
                    
        if (userResult.length > 0) {
            const groups = [];
            const entitlements = [];
            const jsonResult = scimUtils.createScimUserFromTableRow(userResult[0], groups, entitlements);
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