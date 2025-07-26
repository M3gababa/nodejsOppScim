function createScimUserFromTableRow(row, groups = [], entitlements = []) {
    const scimUser = {
        schemas: [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
        ],
        id: row.id,
        externalId: row.user_id,
        userName: row.email,
        name: null,
        givenName: row.firstname,
        familyName: row.lastname,
        formatted: row.firstname + " " + row.lastname,
        displayName: row.firstname + " " + row.lastname,
        active: row.status===1 || row.status===true,
        title: row.title,
        emails: [
            {
                "value": row.email,
                "type": "work",
                "primary": true
            }
        ],
        addresses: [
            {
                type: "work",
                streetAddress: row.street || row.locations.street,
                postalCode: row.zipcode || row.locations.zipcode,
                locality: row.city || row.locations.city,
                country: row.country || row.locations.country,
                formatted: (row.street || row.locations.street) + ", " + 
                    (row.zipcode || row.locations.zipcode) + " " + 
                    (row.city || row.locations.city) + ", " + 
                    (row.country || row.locations.country),
                primary: true
            }
        ],
        groups: groups.map(group => JSON.parse(
            `{
                "value":"${group.group_pk_id}",
                "$ref":"${urlRoot}/scim/v2/Groups/${group.group_pk_id}",
                "display":"${group.group_name}"
            }`
        )),
        entitlements: entitlements.map(entitlement => JSON.parse(
            `{
                "value":"${entitlement.entitlement_pk_id}",
                "$ref":"${urlRoot}/scim/v2/Entitlements/${entitlement.entitlement_pk_id}",
                "type":"${entitlement.entitlement_type}",
                "display":"${entitlement.entitlement_name}"
            }`
        )),
        "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
            employeeNumber: row.user_id
        },
        meta: {
            resourceType: "User",
            location: `${urlRoot}/scim/v2/Users/${row.id}`
        }
    };

    return scimUser;
}

function createScimGroupFromTableRow(row, members = []) {
    const scimGroup = {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            id: row.id,
            displayName: row.display_name,
            description: row.description,
            members: members.map(member => JSON.parse(
                `{
                    "value":"${member.user_pk_id}",
                    "$ref":"${urlRoot}/scim/v2/Users/${member.user_pk_id}",
                    "display":"${member.user_pk_email}"
                }`
            )),
            meta: {
                resourceType: "Group",
                location: `${urlRoot}/scim/v2/Groups/${row.id}`
            }
        };

    return scimGroup;
}

function createScimEntitlementFromTableRow(row, members = []) {
    const scimEntitlement = {
        schemas: ["urn:okta:scim:schemas:core:1.0:Entitlement"],
            id: row.id,
            type: row.type,
            description: row.description,
            displayName: row.display_name,
            members: members.map(member => JSON.parse(
                `{
                    "value":"${member.user_pk_id}",
                    "$ref":"${urlRoot}/scim/v2/Users/${member.user_pk_id}",
                    "display":"${member.user_pk_email}"
                }`
            )),
            meta: {
                resourceType: "Entitlement",
                location: `${urlRoot}/scim/v2/Entitlements/${row.id}`
            }
        };

    return scimEntitlement;
}

module.exports = {
    createScimUserFromTableRow,
    createScimGroupFromTableRow,
    createScimEntitlementFromTableRow
};