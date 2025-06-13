function createScimUserFromTableRow(row) {
    const scimUser = {
        schemas: [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:okta:scim:2.0:user:custom"
        ],
        id: row[0],
        externalId: row[0], // BID (same as id)
        userName: row[16].split(',')[0], // MAIL
        name: {
            givenName: row[22], // FIRSTNAME
            familyName: row[23], // LASTNAME
            formatted: row[17], // CN
        },
        displayName: row[17], // CN
        active: true, // You might need logic to determine this
        title: row[3], // TITLE
        emails: row[16] ? [{ value: row[16].split(',')[1], type: "work", primary: true }] : [], // MAIL
        groups: [], // You'll likely need a separate query to populate this
        "urn:okta:scim:2.0:user:custom": {
            dn: row[2], 
            description: row[3], 
            adlogin: row[5], 
            bid: row[0], 
            campus: row[6], 
            csn: row[7], 
            mail: row[8], 
            mfaactive: row[9], 
            nomnaiss: row[10], 
            prenomnaiss: row[11], 
            pegaseid: row[12], 
            initials: row[14], 
            ipphone: row[15], 
            personalmail: row[18] 
        },
        meta: {
            resourceType: "User",
            created: row[26] ? new Date(row[26]).toISOString() : null, 
            lastModified: row[26] ? new Date(row[26]).toISOString() : null, 
            location: `/Users/${row[0]}` // BID
        }
    };

    return scimUser;
}

function createScimGroupFromTableRow(row) {
    const scimGroup = {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            id: row[0],
            externalId: row[0],
            displayName: row[1],
            meta: {
                resourceType: "Group",
                created: null,
                lastModified: null,
                location: `/Groups/${row[0]}`
            }
        };

    return scimGroup;
}

module.exports = {
    createScimUserFromTableRow,
    createScimGroupFromTableRow
};