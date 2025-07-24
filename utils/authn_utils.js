const auth = require('basic-auth');

//  Define your user credentials (in a real application, use a database)
// TODO : Clean Up
const creds = {
    'login': 'scimUser',
    'pwd': 'P@ssw0rd123!',
};

const authenticate = (req, res, next) => {
    const user = auth(req);
    
    if (!user || creds.login !== user.name || creds.pwd !== user.pass) {
        res.setHeader('WWW-Authenticate', 'Basic realm="My Realm"');
        res.status(401).send({ error: 'Authentication required' });
    } else {
        req.user = user;
        next();
    }
};

module.exports = {
  authenticate
};
