const out = require('../../logs');

const dbUtils = require('../../utils/postgres_utils');
const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');

var router = require('express').Router();

// --- User Resource Endpoints ---
router.get('/', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);

    // TODO : Pagination
    try {
        const userList = await dbUtils.getUsers();

        const users = [];

        for (const row of userList) {
            const groupList = await dbUtils.getGroupsPerUser(row.id);
            const groups = groupList.map(entry => ({ "group_pk_id": entry.groups.id, "group_name": entry.groups.display_name }));

            const entltList = await dbUtils.getEntitlementsPerUser(row.id);
            const entitlements = entltList.map(entry => ({ "entitlement_pk_id": entry.entitlements.id, "entitlement_type": entry.entitlements.type, "entitlement_name": entry.entitlements.display_name }));

            users.push(scimUtils.createScimUserFromTableRow(row, groups, entitlements));
        };
        
        const jsonResult = {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            totalResults: users.length,
            Resources: users
        };
        
        
        res.json(jsonResult);
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: 'Error retrieving users' });
    }
});

router.get('/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const userId = req.params.id;
    try {
        const userResult = await dbUtils.getUser(userId);
                   
        if (userResult.length > 0) {
            const groupList = await dbUtils.getGroupsPerUser(userId);
            const groups = groupList.map(entry => ({ "group_pk_id": entry.groups.id, "group_name": entry.groups.display_name }));

            const entltList = await dbUtils.getEntitlementsPerUser(userId);
            const entitlements = entltList.map(entry => ({ "entitlement_pk_id": entry.entitlements.id, "entitlement_type": entry.entitlements.type, "entitlement_name": entry.entitlements.display_name }));

            const jsonResult = scimUtils.createScimUserFromTableRow(userResult[0], groups, entitlements);
            
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