function createScimUserFromTableRow(row) {
    const scimUser = {
        schemas: [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:okta:2.0:User",
            "urn:okta:bduveyoie_banner_2:2.0:User:Custom"
        ],
        id: row[0], // BID
        externalId: row[0], // BID (same as id)
        userName: row[16], // MAIL
        name: {
            givenName: row[22], // FIRSTNAME
            familyName: row[23], // LASTNAME
            formatted: row[2], // CN
        },
        displayName: row[2], // CN
        active: true, // You might need logic to determine this
        title: row[4], // TITLE
        emails: row[16] ? [{ value: row[16], type: "work", primary: true }] : [], // MAIL
        groups: [], // You'll likely need a separate query to populate this
        meta: {
            resourceType: "User",
            created: row[26] ? new Date(row[26]).toISOString() : null, // ACTIVITY_DATE
            lastModified: row[26] ? new Date(row[26]).toISOString() : null, // ACTIVITY_DATE
            location: `/Users/${row[0]}` // BID
        },
        "urn:okta:bduveyoie_banner_2:2.0:User:Custom": {
            DN: row[2], // DN
            DESCRIPTION: row[3], // DESCRIPTION
            ADLOGIN: row[5], // ESSECADLOGIN
            BID: row[0], // BID
            CAMPUS: row[6], // ESSECCAMPUS
            CSN: row[7], // ESSECCSN
            MAIL: row[8], // ESSECMAIL
            MFAACTIVE: row[9] === 'TRUE', // ESSECMFAACTIVE, convert to boolean
            NOMNAISS: row[10], // ESSECNOMNAISS
            PRENOMNAISS: row[11], // ESSECPRENOMNAISS
            PEGASEID: row[12], // ESSECPEGASEID
            INITIALS: row[14], // INITIALS
            IPPHONE: row[15], // IPPHONE
            PERSONALMAIL: row[18] // PERSONALMAIL
        }
    };

    return scimUser;
}

function createScimGroupFromTableRow(row) {
    const scimGroup = {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
            id: row[0],
            externalId: row[0],         // id
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