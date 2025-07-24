const oracledb = require("oracledb");
const fs = require("fs");
let out = require("../core/logs");

function base64ToString(base64String) {
  try {
    return Buffer.from(base64String, "base64").toString("utf8");
  } catch (err) {
    out.log("ERROR", "SQL", "Error decoding Base64 string:" + err);
    return null;
  }
}

async function getConnection() {
  try {
    const config = JSON.parse(fs.readFileSync("dbconfig.json", "utf8"));
    // const libDir = "/usr/lib/oracle/11.1";
    // oracledb.initOracleClient({ libDir: libDir });
    return await oracledb.getConnection({
      user: config.user,
      password: base64ToString(config.password),
      connectString: config.connectString,
    });
  } catch (err) {
    out.log("ERROR", "SQL", "Error getting database connection:" + err);
    throw err;
  }
}

async function executeQuery(connection, sql, binds = []) {
  try {
    const result = await connection.execute(sql, binds);
    return result;
  } catch (err) {
    out.log("ERROR", "SQL", "Error executing query:" + err);
    throw err;
  }
}

module.exports = {
  getConnection,
  executeQuery,
};
