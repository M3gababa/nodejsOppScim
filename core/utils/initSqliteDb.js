const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the database file path.
const DB_PATH = path.join(process.cwd(), 'mydatabase.db');

/**
* Helper function to run db.run with async/await.
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
* Generic method to insert data into a table.
* It uses INSERT OR IGNORE to prevent duplicate entries based on unique constraints.
* @param {sqlite3.Database} db The database instance.
* @param {string} tableName The name of the table to insert into.
* @param {Array<Object>} dataArray An array of objects, where each object represents a row to insert.
*/
async function insertData(db, tableName, dataArray) {
    if (!dataArray || dataArray.length === 0) {
        console.log(`No data to insert for table ${tableName}.`);
        return;
    }
    
    // Get column names from the first object in the dataArray
    const columns = Object.keys(dataArray[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.join(', ');
    
    // Handle 'GROUP' table name which is a reserved keyword
    const quotedTableName = tableName === 'GROUP' ? `'GROUP'` : tableName;
    
    const insertSql = `
        INSERT OR IGNORE INTO ${quotedTableName} (${columnNames})
        VALUES (${placeholders})
    `;
    
    console.log(`Attempting to insert initial ${tableName} data...`);
    for (const data of dataArray) {
        const values = columns.map(col => data[col]);
        try {
            const result = await runAsync(db, insertSql, values);
            if (result.changes > 0) {
                // Log inserted ID and a relevant name/ID for clarity
                const identifier = data.name || data.display_name || data.user_id || `ID: ${result.lastID}`;
                console.log(`Entry into ${tableName} inserted: ${identifier}`);
            } else {
                const identifier = data.name || data.display_name || data.user_id || `(duplicate)`;
                console.log(`Entry into ${tableName} already exists: ${identifier}`);
            }
        } catch (err) {
            console.error(`Error inserting into ${tableName} for entry ${JSON.stringify(data)}:`, err.message);
            // Continue with other inserts even if one fails
        }
    }
    console.log(`Finished inserting data for table ${tableName}.`);
}

/**
* Initializes the SQLite database and creates tables if they don't exist.
*/
function initializeDatabase() {
    // Open the database connection.
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to the SQLite database.');
            // Call the function to create tables and insert data once connected.
            createTables(db);
        }
    });
    
    return db;
}

/**
* Creates the necessary tables in the SQLite database.
* @param {sqlite3.Database} db The database instance.
*/
function createTables(db) {
    // Enable foreign key constraints. This is crucial for FKs to work.
    db.run("PRAGMA foreign_keys = ON;", (err) => {
        if (err) {
            console.error("Error enabling foreign key constraints:", err.message);
        } else {
            console.log("Foreign key constraints enabled.");
        }
    });
    
    // SQL statement to create the LOCATION table.
    const createLocationTableSql = `
        CREATE TABLE IF NOT EXISTS LOCATION (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            street TEXT,
            city TEXT,
            zipcode TEXT,
            country TEXT
        );
    `;
    
    // SQL statement to create the USER table.
    const createUserTableSql = `
        CREATE TABLE IF NOT EXISTS USER (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            firstname TEXT NOT NULL,
            lastname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            title TEXT,
            job_code TEXT,
            job_name TEXT,
            location INTEGER, -- Foreign key to LOCATION table
            status BOOLEAN NOT NULL DEFAULT 1, -- 1 for active, 0 for inactive
            FOREIGN KEY (location) REFERENCES LOCATION(id) ON DELETE SET NULL
        );
    `;
    
    // SQL statement to create the GROUP table.
    const createGroupTableSql = `
        CREATE TABLE IF NOT EXISTS 'GROUP' (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            display_name TEXT NOT NULL UNIQUE,
            description TEXT
        );
    `;
    
    // SQL statement to create the ENTITLEMENT table.
    const createEntitlementTableSql = `
        CREATE TABLE IF NOT EXISTS ENTITLEMENT (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            display_name TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            description TEXT
        );
    `;
    
    // SQL statement to create the GROUP_MEMBERSHIP table.
    // Links users to groups.
    const createGroupMembershipTableSql = `
        CREATE TABLE IF NOT EXISTS GROUP_MEMBERSHIP (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            group_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES 'GROUP'(id) ON DELETE CASCADE,
            UNIQUE (user_id, group_id) -- Ensures a user can only be in a group once
        );
    `;
    
    // SQL statement to create the ENTITLEMENT_MEMBERSHIP table.
    // Links users to entitlements.
    const createEntitlementMembershipTableSql = `
        CREATE TABLE IF NOT EXISTS ENTITLEMENT_MEMBERSHIP (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            entitlement_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES USER(id) ON DELETE CASCADE,
            FOREIGN KEY (entitlement_id) REFERENCES ENTITLEMENT(id) ON DELETE CASCADE,
            UNIQUE (user_id, entitlement_id) -- Ensures a user can only have an entitlement once
        );
    `;
    
    // Execute the table creation statements sequentially.
    // Order matters due to foreign key dependencies.
    db.serialize(async () => {
        let tableOk = true;
        db.run(createLocationTableSql, (err) => {
            if (err) { 
                console.error('Error creating LOCATION table:', err.message); 
                tableOk = false;
            } else { 
                console.log('LOCATION table created or already exists.');
            }
        });
        
        db.run(createUserTableSql, (err) => {
            if (err) { 
                console.error('Error creating USER table:', err.message); 
                tableOk = false;
            } else { 
                console.log('USER table created or already exists.'); 
            }
        });
        
        db.run(createGroupTableSql, (err) => {
            if (err) { 
                console.error('Error creating GROUP table:', err.message); 
                tableOk = false;
            } else { 
                console.log('GROUP table created or already exists.'); 
            }
        });
        
        db.run(createEntitlementTableSql, (err) => {
            if (err) { 
                console.error('Error creating ENTITLEMENT table:', err.message); 
                tableOk = false;
            } else { 
                console.log('ENTITLEMENT table created or already exists.'); 
            }
        });
        
        db.run(createGroupMembershipTableSql, (err) => {
            if (err) { 
                console.error('Error creating GROUP_MEMBERSHIP table:', err.message); 
                tableOk = false;
            } else { 
                console.log('GROUP_MEMBERSHIP table created or already exists.'); 
            }
        });
        
        db.run(createEntitlementMembershipTableSql, (err) => {
            if (err) { 
                console.error('Error creating ENTITLEMENT_MEMBERSHIP table:', err.message); 
                tableOk = false;
            } else { 
                console.log('ENTITLEMENT_MEMBERSHIP table created or already exists.'); 
            }
        });

        // Insert data only if table creation was ok
        if(tableOk) {
            await insertData(db, 'LOCATION', locations);
            await insertData(db, 'ENTITLEMENT', entitlements);
            await insertData(db, 'GROUP', groups);
            await insertData(db, 'USER', users);
            await insertData(db, 'GROUP_MEMBERSHIP', groupMemberships);
            await insertData(db, 'ENTITLEMENT_MEMBERSHIP', entitlementMemberships);
        }
    });
}

const locations = [
    { name: 'Paris Office', description: 'Main office in Paris', street: '1 Rue de la Paix', city: 'Paris', zipcode: '75002', country: 'FRANCE' },
    { name: 'Lyon Branch', description: 'Branch office in Lyon', street: '2 Place Bellecour', city: 'Lyon', zipcode: '69002', country: 'FRANCE' },
    { name: 'Marseille Hub', description: 'Logistics hub in Marseille', street: '3 Vieux Port', city: 'Marseille', zipcode: '13001', country: 'FRANCE' },
    { name: 'Bordeaux Sales', description: 'Sales office in Bordeaux', street: '4 Quai des Chartrons', city: 'Bordeaux', zipcode: '33000', country: 'FRANCE' },
    { name: 'Nice Studio', description: 'Creative studio in Nice', street: '5 Promenade des Anglais', city: 'Nice', zipcode: '06000', country: 'FRANCE' }
];

const entitlements = [
    { display_name: 'ENTL_AdminAccess', type: 'Permission set', description: 'Grants full administrative access to the system.' },
    { display_name: 'ENTL_UserManagement', type: 'Permission set', description: 'Allows managing user accounts and profiles.' },
    { display_name: 'ENTL_ReportGeneration', type: 'Permission set', description: 'Enables generation and viewing of system reports.' },
    { display_name: 'ENTL_DataEntry', type: 'Permission set', description: 'Permits entry and modification of core data.' },
    { display_name: 'ENTL_ViewOnly', type: 'Permission set', description: 'Provides read-only access to all system data.' },
    { display_name: 'ENTL_FinanceModule', type: 'Permission set', description: 'Access to financial records and operations.' },
    { display_name: 'ENTL_HRModule', type: 'Permission set', description: 'Access to human resources data and functions.' },
    { display_name: 'ENTL_ProjectManager', type: 'Permission set', description: 'Permissions for managing projects and tasks.' },
    { display_name: 'ENTL_SupportAgent', type: 'Permission set', description: 'Access for customer support operations.' },
    { display_name: 'ENTL_DeveloperTools', type: 'Permission set', description: 'Access to development and debugging tools.' },
    { display_name: 'ENTL_AuditLogs', type: 'Permission set', description: 'Permission to view system audit logs.' },
    { display_name: 'ENTL_Configuration', type: 'Permission set', description: 'Ability to modify system configurations.' },
    { display_name: 'ENTL_BillingAccess', type: 'Permission set', description: 'Access to billing and invoicing features.' },
    { display_name: 'ENTL_MarketingTools', type: 'Permission set', description: 'Permissions for marketing campaign management.' },
    { display_name: 'ENTL_GuestAccess', type: 'Permission set', description: 'Limited access for external guests or partners.' }
];

const groups = [
    { display_name: 'EU_France', description: 'Group for members associated with France operations.' },
    { display_name: 'EU_Germany', description: 'Group for members associated with Germany operations.' },
    { display_name: 'EU_Italy', description: 'Group for members associated with Italy operations.' },
    { display_name: 'EU_Spain', description: 'Group for members associated with Spain operations.' },
    { display_name: 'EU_Poland', description: 'Group for members associated with Poland operations.' },
    { display_name: 'EU_Netherlands', description: 'Group for members associated with Netherlands operations.' },
    { display_name: 'EU_Belgium', description: 'Group for members associated with Belgium operations.' },
    { display_name: 'EU_Sweden', description: 'Group for members associated with Sweden operations.' }
];

const users = [
    { user_id: 'USR001', firstname: 'Alice', lastname: 'Dupont', email: 'alice.dupont@example.com', title: 'Software Engineer', job_code: 'ENG001', job_name: 'Engineer', location: 1, status: true }, // Paris
    { user_id: 'USR002', firstname: 'Bob', lastname: 'Martin', email: 'bob.martin@example.com', title: 'Product Manager', job_code: 'PROD001', job_name: 'Product', location: 2, status: true }, // Lyon
    { user_id: 'USR003', firstname: 'Charlie', lastname: 'Durand', email: 'charlie.durand@example.com', title: 'Sales Representative', job_code: 'SALES001', job_name: 'Sales', location: 3, status: true }, // Marseille
    { user_id: 'USR004', firstname: 'Diana', lastname: 'Petit', email: 'diana.petit@example.com', title: 'HR Specialist', job_code: 'HR001', job_name: 'Human Resources', location: 4, status: true }, // Bordeaux
    { user_id: 'USR005', firstname: 'Eve', lastname: 'Leroy', email: 'eve.leroy@example.com', title: 'Marketing Coordinator', job_code: 'MKTG001', job_name: 'Marketing', location: 5, status: true }, // Nice
    { user_id: 'USR006', firstname: 'Frank', lastname: 'Roux', email: 'frank.roux@example.com', title: 'DevOps Engineer', job_code: 'ENG002', job_name: 'Engineer', location: 1, status: true }, // Paris
    { user_id: 'USR007', firstname: 'Grace', lastname: 'Moreau', email: 'grace.moreau@example.com', title: 'Financial Analyst', job_code: 'FIN001', job_name: 'Finance', location: 2, status: true }, // Lyon
    { user_id: 'USR008', firstname: 'Henry', lastname: 'Fournier', email: 'henry.fournier@example.com', title: 'Customer Support', job_code: 'CS001', job_name: 'Customer Service', location: 3, status: false }, // Marseille (Inactive)
    { user_id: 'USR009', firstname: 'Ivy', lastname: 'Girard', email: 'ivy.girard@example.com', title: 'UI/UX Designer', job_code: 'DESIGN001', job_name: 'Design', location: 4, status: true }, // Bordeaux
    { user_id: 'USR010', firstname: 'Jack', lastname: 'Lambert', email: 'jack.lambert@example.com', title: 'Data Scientist', job_code: 'DATA001', job_name: 'Data Science', location: 5, status: true }  // Nice
];

// Assuming User IDs are 1-10 and Group IDs are 1-8 based on insertion order
const groupMemberships = [
    { user_id: 1, group_id: 1 }, // Alice (USR001) in EU_France (Group 1)
    { user_id: 2, group_id: 2 }, // Bob (USR002) in EU_Germany (Group 2)
    { user_id: 2, group_id: 1 }, // Bob (USR002) in EU_France (Group 1)
    { user_id: 3, group_id: 3 }, // Charlie (USR003) in EU_Italy (Group 3)
    { user_id: 4, group_id: 4 }, // Diana (USR004) in EU_Spain (Group 4)
    { user_id: 5, group_id: 5 }, // Eve (USR005) in EU_Poland (Group 5)
    { user_id: 6, group_id: 1 }, // Frank (USR006) in EU_France (Group 1)
    { user_id: 6, group_id: 7 }, // Frank (USR006) in EU_Belgium (Group 7)
    { user_id: 7, group_id: 6 }, // Grace (USR007) in EU_Netherlands (Group 6)
    { user_id: 8, group_id: 3 }, // Henry (USR008) in EU_Italy (Group 3)
    { user_id: 9, group_id: 4 }, // Ivy (USR009) in EU_Spain (Group 4)
    { user_id: 9, group_id: 8 }, // Ivy (USR009) in EU_Sweden (Group 8)
    { user_id: 10, group_id: 2 } // Jack (USR010) in EU_Germany (Group 2)
];

// Assuming User IDs are 1-10 and Entitlement IDs are 1-15 based on insertion order
const entitlementMemberships = [
    { user_id: 1, entitlement_id: 1 },  // Alice (USR001) has ENTL_AdminAccess
    { user_id: 1, entitlement_id: 2 },  // Alice (USR001) has ENTL_UserManagement
    { user_id: 1, entitlement_id: 3 },  // Alice (USR001) has ENTL_ReportGeneration
    { user_id: 2, entitlement_id: 8 },  // Bob (USR002) has ENTL_ProjectManager
    { user_id: 2, entitlement_id: 4 },  // Bob (USR002) has ENTL_DataEntry
    { user_id: 3, entitlement_id: 13 }, // Charlie (USR003) has ENTL_BillingAccess
    { user_id: 3, entitlement_id: 5 },  // Charlie (USR003) has ENTL_ViewOnly
    { user_id: 4, entitlement_id: 7 },  // Diana (USR004) has ENTL_HRModule
    { user_id: 4, entitlement_id: 5 },  // Diana (USR004) has ENTL_ViewOnly
    { user_id: 5, entitlement_id: 14 }, // Eve (USR005) has ENTL_MarketingTools
    { user_id: 5, entitlement_id: 5 },  // Eve (USR005) has ENTL_ViewOnly
    { user_id: 6, entitlement_id: 10 }, // Frank (USR006) has ENTL_DeveloperTools
    { user_id: 6, entitlement_id: 11 }, // Frank (USR006) has ENTL_AuditLogs
    { user_id: 7, entitlement_id: 6 },  // Grace (USR007) has ENTL_FinanceModule
    { user_id: 7, entitlement_id: 3 },  // Grace (USR007) has ENTL_ReportGeneration
    { user_id: 8, entitlement_id: 9 },  // Henry (USR008) has ENTL_SupportAgent
    { user_id: 8, entitlement_id: 15 }, // Henry (USR008) has ENTL_GuestAccess
    { user_id: 9, entitlement_id: 12 }, // Ivy (USR009) has ENTL_Configuration
    { user_id: 9, entitlement_id: 5 },  // Ivy (USR009) has ENTL_ViewOnly
    { user_id: 10, entitlement_id: 3 }, // Jack (USR010) has ENTL_ReportGeneration
    { user_id: 10, entitlement_id: 4 }  // Jack (USR010) has ENTL_DataEntry
];

// Export the initialization function so it can be called from your service's entry point.
module.exports = initializeDatabase;