import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const usageDbPath = path.join(__dirname, '../database/command_usage.json');

// Helper to get today's date string
const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Read the entire usage database
function readUsageDb() {
    try {
        if (!fs.existsSync(usageDbPath)) {
            // If the file doesn't exist, create it with an empty object
            fs.writeFileSync(usageDbPath, JSON.stringify({}), 'utf-8');
            return {};
        }
        const data = fs.readFileSync(usageDbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading usage DB, returning empty object:", error);
        return {};
    }
}

// Write the entire usage database
function writeUsageDb(data) {
    try {
        const dir = path.dirname(usageDbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(usageDbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing to usage DB:", error);
    }
}

/**
 * Gets the usage data for a specific user and command.
 * Resets the count if the last usage was on a different day.
 * @param {string} userId The user's ID (e.g., '12345@s.whatsapp.net').
 * @param {string} commandName The name of the command (e.g., 'artista').
 * @returns {{count: number, last_used: string}} The user's usage data for the command.
 */
export function getCommandUsage(userId, commandName) {
    const usageDb = readUsageDb();
    const today = getTodayDate();

    if (!usageDb[userId]) {
        usageDb[userId] = {};
    }
    if (!usageDb[userId][commandName]) {
        usageDb[userId][commandName] = { count: 0, last_used: today };
    }

    const commandUsage = usageDb[userId][commandName];

    // Reset daily count if last use was not today
    if (commandUsage.last_used !== today) {
        commandUsage.count = 0;
        commandUsage.last_used = today;
        writeUsageDb(usageDb); // Persist the reset
    }

    return commandUsage;
}

/**
 * Increments the usage count for a user and command.
 * @param {string} userId The user's ID.
 * @param {string} commandName The name of the command.
 */
export function incrementCommandUsage(userId, commandName) {
    const usageDb = readUsageDb();
    const today = getTodayDate();

    // Ensure the user and command are initialized
    if (!usageDb[userId]) {
        usageDb[userId] = {};
    }
    if (!usageDb[userId][commandName] || usageDb[userId][commandName].last_used !== today) {
        usageDb[userId][commandName] = { count: 1, last_used: today };
    } else {
        usageDb[userId][commandName].count++;
    }

    writeUsageDb(usageDb);
}

/**
 * Deletes all usage data for a specific user.
 * @param {string} userId The user's ID.
 */
export function deleteUserUsage(userId) {
    const usageDb = readUsageDb();
    if (usageDb[userId]) {
        delete usageDb[userId];
        writeUsageDb(usageDb);
    }
}