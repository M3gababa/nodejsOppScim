const out = require('../../logs');

const dbUtils = require('../../utils/sqlite_utils');
const scimUtils = require('../../utils/scim_utils');
const { authenticate } = require('../../utils/authn_utils');

var router = require('express').Router();

// --- User Resource Endpoints ---
router.get('/', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);

    // TODO : Pagination
    try {
        const userQuery = `SELECT 
            U.*,
            L.name AS location_name,
            L.description AS location_description,
            L.street,
            L.city,
            L.zipcode,
            L.country
        FROM
            USER U
        JOIN
            LOCATION L ON U.location = L.id
        `;
        
        const userList = await dbUtils.executeSql(userQuery);
              
        const groupQuery = `SELECT
            G.id AS group_pk_id,
            G.display_name AS group_name,
            G.description AS group_description
        FROM
            USER U
        JOIN
            GROUP_MEMBERSHIP GM ON U.id = GM.user_id
        JOIN
            "GROUP" G ON GM.group_id = G.id
        WHERE
            U.id = ?
        `;

        const entitlementQuery = `SELECT
            E.id AS entitlement_pk_id,
            E.display_name AS entitlement_name,
            E.type AS entitlement_type,
            E.description AS entitlement_description
        FROM
            USER U
        JOIN
            ENTITLEMENT_MEMBERSHIP EM ON U.id = EM.user_id
        JOIN
            ENTITLEMENT E ON EM.entitlement_id = E.id
        WHERE
            U.id = ?
        `;
      
        const users = [];

        for (const row of userList) {
            const groups = await dbUtils.executeSql(groupQuery, row.id);
            const entitlements = await dbUtils.executeSql(entitlementQuery, row.id);
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
        const userQuery = `SELECT 
            U.*,
            L.name AS location_name,
            L.description AS location_description,
            L.street,
            L.city,
            L.zipcode,
            L.country
        FROM
            USER U
        JOIN
            LOCATION L ON U.location = L.id
        WHERE
            U.id = ?
        `;
        
        const userResult = await dbUtils.executeSql(userQuery, userId, true);
              
        const groupQuery = `SELECT
            G.id AS group_pk_id,
            G.display_name AS group_name
        FROM
            USER U
        JOIN
            GROUP_MEMBERSHIP GM ON U.id = GM.user_id
        JOIN
            "GROUP" G ON GM.group_id = G.id
        WHERE
            U.id = ?
        `;

        const entitlementQuery = `SELECT
            E.id AS entitlement_pk_id,
            E.display_name AS entitlement_name,
            E.type AS entitlement_type
        FROM
            USER U
        JOIN
            ENTITLEMENT_MEMBERSHIP EM ON U.id = EM.user_id
        JOIN
            ENTITLEMENT E ON EM.entitlement_id = E.id
        WHERE
            U.id = ?
        `;
                    
        if (userResult) {
            const groups = await dbUtils.executeSql(groupQuery, userResult.id);
            const entitlements = await dbUtils.executeSql(entitlementQuery, userResult.id);
            const jsonResult = scimUtils.createScimUserFromTableRow(userResult, groups, entitlements);
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