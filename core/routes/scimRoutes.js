const fs = require('fs');
const out = require('../logs');

const { authenticate } = require('../../utils/authn_utils');

var router = require('express').Router();

router.get('/', authenticate, (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    let txt = "&#9940; This is not suitable for PRODUCTION &#9940; </br>";
    txt += "This aims to be a test for the BANNER database import and is not suitable for PRODUCTION.<br/>";
    txt += "This endpoint specify that this is a SCIM connector <br/>";
    txt += "This endpoint specify that this is based on SCIM V2.0 model";
    res.send(txt);
});

// --- Service Provider Config Endpoints ---
router.get('/ServiceProviderConfig', (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    res.json(JSON.parse(fs.readFileSync('./scim/serviceProviderConfig.json', 'utf8')));
});

router.get('/ResourceTypes', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const jsonResourceTypes = JSON.parse(fs.readFileSync('./scim/resourceTypes.json', 'utf8'));
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
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const attrId = req.params.id;
    const jsonResourceTypes = JSON.parse(fs.readFileSync('./scim/resourceTypes.json', 'utf8'));
    const resourceType = jsonResourceTypes.find(obj => obj.id===attrId);
    
    res.json(resourceType);
});

router.get('/Schemas', authenticate, async (req, res) => {
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const jsonSchema = JSON.parse(fs.readFileSync('./scim/schemas.json', 'utf8'));
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
    out.log("INFO", "GET", "Got request: " + req.url);
    
    const attrId = req.params.id;
    const jsonSchema = JSON.parse(fs.readFileSync('./scim/schemas.json', 'utf8'));
    
    const attributeSpec = jsonSchema.find(obj => obj.id===attrId);
    
    res.json(attributeSpec);
});

const userRoutes = require('./userRoutes');
router.use('/Users', userRoutes);

const groupRoutes = require('./groupRoutes');
router.use('/Groups', groupRoutes);

const entitlementRoutes = require('./entitlementRoutes');
router.use('/Entitlements', entitlementRoutes);

module.exports = router;