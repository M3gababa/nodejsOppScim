function createScimUserFromTableRow(row) {
    const scimUser = {
        schemas: [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:okta:bduveyoie_banner_2:2.0:user:custom"
        ],
        id: row[0], // BID
        externalId: row[0], // BID (same as id)
        userName: row[16], // MAIL
        name: {
            givenName: row[22], // FIRSTNAME
            familyName: row[23], // LASTNAME
            formatted: row[17], // CN
        },
        displayName: row[17], // CN
        active: true, // You might need logic to determine this
        title: row[3], // TITLE
        emails: row[16] ? [{ value: row[16], type: "work", primary: true }] : [], // MAIL
        groups: [], // You'll likely need a separate query to populate this
        "urn:okta:bduveyoie_banner_2:2.0:user:custom": {
            dn: row[2], // DN
            description: row[3], // DESCRIPTION
            adlogin: row[5], // ESSECADLOGIN
            bid: row[0], // BID
            campus: row[6], // ESSECCAMPUS
            csn: row[7], // ESSECCSN
            mail: row[8], // ESSECMAIL
            mfaactive: row[9], // ESSECMFAACTIVE, convert to boolean
            nomnaiss: row[10], // ESSECNOMNAISS
            prenomnaiss: row[11], // ESSECPRENOMNAISS
            pegaseid: row[12], // ESSECPEGASEID
            initials: row[14], // INITIALS
            ipphone: row[15], // IPPHONE
            personalmail: row[18] // PERSONALMAIL
        },
        meta: {
            resourceType: "User",
            created: row[26] ? new Date(row[26]).toISOString() : null, // ACTIVITY_DATE
            lastModified: row[26] ? new Date(row[26]).toISOString() : null, // ACTIVITY_DATE
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