const out = require('../logs');

const dbUtils = require('../../utils/sqlite_utils');
const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');

var router = require('express').Router();

// --- Group Resource Endpoints ---
router.get('', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    try {
        // TODO : Add Pagination
        const queryGroup = `SELECT
            * 
        FROM
            "GROUP"
        `;

        const groupList = await dbUtils.executeSql(queryGroup);

        const userQuery = `SELECT
            U.id AS user_pk_id,
            U.email AS user_pk_email
        FROM
            USER U
        JOIN
            GROUP_MEMBERSHIP GM ON U.id = GM.user_id
        JOIN
            "GROUP" G ON GM.group_id = G.id
        WHERE
            G.id = ?
        `;
        
        const groups = [];

        for (const row of groupList) {
            const members = await dbUtils.executeSql(userQuery, row.id);
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
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const groupId = req.params.id;

    try {        
        const queryGroup = `SELECT
            * 
        FROM
            "GROUP"
        WHERE
            ID = ?
        `;

        const groupResult = await dbUtils.executeSql(queryGroup, groupId, true);

        const userQuery = `SELECT
            U.id AS user_pk_id,
            U.email AS user_pk_email
        FROM
            USER U
        JOIN
            GROUP_MEMBERSHIP GM ON U.id = GM.user_id
        JOIN
            "GROUP" G ON GM.group_id = G.id
        WHERE
            G.id = ?
        `;

        if (groupResult) {
            const members = await dbUtils.executeSql(userQuery, groupId);
            const jsonResult = scimUtils.createScimGroupFromTableRow(groupResult, members);
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