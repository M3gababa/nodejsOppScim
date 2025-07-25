const fs = require('fs');
const path = require('path');
var router = require('express').Router();

const out = require('../logs');
const initSQL = require('../utils/initSqliteDb');
const { authenticate } = require('../utils/authn_utils');

// --- Service Provider Config Endpoints ---
router.get('/ServiceProviderConfig', authenticate, (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    const f = path.join(process.cwd(), 'scim/serviceProviderConfig.json');
    res.json(JSON.parse(fs.readFileSync(f, 'utf8')));
});

router.get('/ResourceTypes', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const f = path.join(process.cwd(), 'scim/resourceTypes.json');
    const jsonResourceTypes = JSON.parse(fs.readFileSync(f, 'utf8').replaceAll("https://example.com", urlRoot));
    const jsonResult = {
        "schemas": [
            "urn:ietf:params:scim:api:messages:2.0:ListResponse"
        ],
        "totalResults": jsonResourceTypes.length,
        "Resources": jsonResourceTypes
    }
    
    res.json(jsonResult);
});

router.get('/ResourceTypes/:id', async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const attrId = req.params.id;
    const f = path.join(process.cwd(), 'scim/resourceTypes.json');
    const jsonResourceTypes = JSON.parse(fs.readFileSync(f, 'utf8').replaceAll("https://example.com", urlRoot));
    const resourceType = jsonResourceTypes.find(obj => obj.id===attrId);
    
    res.json(resourceType);
});

router.get('/Schemas', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const f = path.join(process.cwd(), 'scim/schemas.json');
    const jsonSchema = JSON.parse(fs.readFileSync(f, 'utf8').replaceAll("https://example.com", urlRoot));
    const jsonResult = {
        "schemas": [
            "urn:ietf:params:scim:api:messages:2.0:ListResponse"
        ],
        "totalResults": jsonSchema.length,
        "Resources": jsonSchema
    }
    
    res.json(jsonResult);
});

router.get('/Schemas/:id', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.originalUrl);
    
    const attrId = req.params.id;
    const f = path.join(process.cwd(), 'scim/schemas.json');
    const jsonSchema = JSON.parse(fs.readFileSync(f, 'utf8').replaceAll("https://example.com", urlRoot));
    
    const attributeSpec = jsonSchema.find(obj => obj.id===attrId);
    
    res.json(attributeSpec);
});

let userRoutes;
let groupRoutes;
let entitlementRoutes;

switch(process.env.TYPE) {
    case "ORACLE":
        userRoutes = require('./oracle/userRoutes');
        groupRoutes = require('./oracle/groupRoutes');
        entitlementRoutes = require('./oracle/entitlementRoutes');    
        break;
    case "AXIOS":
        userRoutes = require('./axios/userRoutes');
        groupRoutes = require('./axios/groupRoutes');
        entitlementRoutes = require('./axios/entitlementRoutes');    
        break;
    case "POSTGRES":
        userRoutes = require('./supabase/userRoutes');
        groupRoutes = require('./supabase/groupRoutes');
        entitlementRoutes = require('./supabase/entitlementRoutes');    
        break;
    default:
        initSQL();

        userRoutes = require('./sqlite/userRoutes');
        groupRoutes = require('./sqlite/groupRoutes');
        entitlementRoutes = require('./sqlite/entitlementRoutes');    
        break;
}

router.use('/Users', userRoutes);
router.use('/Groups', groupRoutes);
router.use('/Entitlements', entitlementRoutes);

module.exports = router;