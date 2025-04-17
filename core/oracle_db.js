const oracledb = require('oracledb');
const fs = require('fs'); // For reading database config

function base64ToString(base64String) {
  try {
    return Buffer.from(base64String, 'base64').toString('utf8');
  } catch (error) {
    console.error('Error decoding Base64 string:', error);
    return null; // Or throw an error, depending on your needs
  }
}

async function getConnection() {
  try {
    const config = JSON.parse(fs.readFileSync('./dbconfig.json', 'utf8'));
    return await oracledb.getConnection({
      user: config.user,
      password: base64ToString(config.password),
      connectString: config.connectString,
    });
  } catch (err) {
    console.error('Error getting database connection:', err);
    throw err;
  }
}

async function executeQuery(connection, sql, binds = []) {
  try {
    const result = await connection.execute(sql, binds);
    return result;
  } catch (err) {
    console.error('Error executing query:', err);
    throw err;
  }
}

module.exports = {
  getConnection,
  executeQuery,
};