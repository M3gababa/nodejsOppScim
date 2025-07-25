const out = require('../../logs');

const dbUtils = require('../../utils/postgres_utils');
const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');

var router = require('express').Router();

// --- Group Resource Endpoints ---
router.get('', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    try {
        const groupList = await dbUtils.getGroups();
        
        const groups = [];

        for (const row of groupList) {
            const memberList = await dbUtils.getUsersPerGroup(row.id);
            const members = memberList.map(entry => ({ "user_pk_id": entry.users.id, "user_pk_email": entry.users.email }));
            groups.push(scimUtils.createScimGroupFromTableRow(row, members));
        };
        
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
    }
});

router.get('/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const groupId = req.params.id;

    try {        
        const groupResult = await dbUtils.getGroup(groupId);

        if (groupResult.length > 0) {
            const memberList = await dbUtils.getUsersPerGroup(groupId);
            const members = memberList.map(entry => ({ "user_pk_id": entry.users.id, "user_pk_email": entry.users.email }));
            const jsonResult = scimUtils.createScimGroupFromTableRow(groupResult[0], members);
            out.logToFile(jsonResult);
            res.json(jsonResult);
        } else {
            out.log("WARNING", "GET", `Group ${groupId} not found`);
            res.status(404).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "404", detail: `Group ${groupId} not found` });
        }
    } catch (err) {
        out.log("ERROR", "GET", err);
        res.status(500).json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], status: "500", detail: `Error retrieving group ${groupId}` });
    }
});

module.exports = router;