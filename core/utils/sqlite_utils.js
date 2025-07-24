const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(appRoot, 'mydatabase.db');

/**
 * Helper function to open a database connection.
 * @returns {Promise<sqlite3.Database>} A promise that resolves with the database instance.
 */
function openDb() {
    return new Promise((resolve, reject) => {
        // sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE ensures the database
        // is opened for reading/writing, and created if it doesn't exist.
        const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                resolve(db);
            }
        });
    });
}

/**
 * Helper function to close a database connection.
 * @param {sqlite3.Database} db The database instance to close.
 * @returns {Promise<void>} A promise that resolves when the database is closed.
 */
function closeDb(db) {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Helper to run db.run with async/await.
 * Used for INSERT, UPDATE, DELETE, and DDL statements (CREATE TABLE).
 * @param {sqlite3.Database} db The database instance.
 * @param {string} sql The SQL query string.
 * @param {Array<any>} [params=[]] Optional parameters for the SQL query.
 * @returns {Promise<Object>} A promise that resolves with the 'this' context from db.run (containing lastID, changes).
 */
function runAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this); // Resolve with 'this' context to get lastID, changes
            }
        });
    });
}

/**
 * Helper to run db.all with async/await.
 * Used for SELECT queries expected to return multiple rows.
 * @param {sqlite3.Database} db The database instance.
 * @param {string} sql The SQL query string.
 * @param {Array<any>} [params=[]] Optional parameters for the SQL query.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of rows.
 */
function runAllAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Helper to run db.get with async/await.
 * Used for SELECT queries expected to return a single row.
 * @param {sqlite3.Database} db The database instance.
 * @param {string} sql The SQL query string.
 * @param {Array<any>} [params=[]] Optional parameters for the SQL query.
 * @returns {Promise<Object|undefined>} A promise that resolves with a single row or undefined if not found.
 */
function getOneAsync(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Generic method to execute SQL queries.
 * This function can handle SELECT (single/multiple), INSERT, UPDATE, DELETE, and DDL statements.
 *
 * @param {string} sql The SQL query string to execute.
 * @param {Array<any>} [params=[]] Optional parameters for the SQL query. Use '?' placeholders in SQL.
 * @param {boolean} [fetchOne=false] If true, fetches a single row (for SELECTs); otherwise, fetches all rows (for SELECTs).
 * This parameter is ignored for non-SELECT queries.
 * @returns {Promise<Array<Object>|Object|undefined>}
 * - For SELECT (fetchOne=false): An array of objects (rows).
 * - For SELECT (fetchOne=true): A single object (row) or undefined.
 * - For INSERT/UPDATE/DELETE/DDL: The 'this' context from db.run (containing lastID, changes).
 */
async function executeSql(sql, params = [], fetchOne = false) {
    let db;
    try {
        db = await openDb();
        let result;

        // Determine if the query is a SELECT statement
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

        if (isSelect) {
            if (fetchOne) {
                result = await getOneAsync(db, sql, params);
            } else {
                result = await runAllAsync(db, sql, params);
            }
        } else {
            // For non-SELECT statements (INSERT, UPDATE, DELETE, CREATE TABLE, etc.)
            result = await runAsync(db, sql, params);
        }
        return result;
    } catch (err) {
        console.error('Error executing SQL query:', err.message, 'SQL:', sql, 'Params:', params);
        throw err; // Re-throw the error for the caller to handle
    } finally {
        if (db) await closeDb(db); // Ensure database is closed
    }
}

// Export the generic query function for use in your application
module.exports = {
    executeSql
};