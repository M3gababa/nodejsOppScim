const { Pool } = require('pg');
const fs = require('fs');

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
    const config = JSON.parse(fs.readFileSync('dbconfig.json', 'utf8'));
    
    // Construct connection object, renaming the keys to be pg-compatible
    const pgConfig = {
      user: config.pg_user,
      host: config.pg_host,
      database: config.pg_database,
      password: base64ToString(config.pg_password),
      port: config.pg_port,
      ssl: config.pg_ssl, //if ssl is required
    };
    
    // Create a new Pool
    const pool = new Pool(pgConfig);
    
    // Get a client from the pool.  This also tests the connection.
    const client = await pool.connect();
    return client; // Return the client
  } catch (err) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    console.error('Error getting PostgreSQL connection:', errorDetail);
    throw new Error(`Failed to connect to PostgreSQL: ${errorDetail}`);
  }
}

async function executeQuery(client, sql, params = []) {
  try {
    const result = await client.query(sql, params);
    return result;
  } catch (err) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    console.error('Error executing PostgreSQL query:', errorDetail);
    throw new Error(`Query execution failed: ${errorDetail}`);
  } finally {
    // IMPORTANT: Release the client back to the pool, regardless of success or failure
    client.release();
  }
}

module.exports = {
  getConnection,
  executeQuery,
};
