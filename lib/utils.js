/**
 * Extracts a user JID from a message.
 * Priority is given to mentions, then replies, then text input.
 * @param {object} msg The message object from the socket.
 * @param {string[]} args The arguments array from the command.
 * @returns {string|null} The extracted user JID or null if not found.
 */
export function getUserFromMessage(msg, args) {
  // Check for mentioned JIDs
  if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
    return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }

  // Check for a participant in a replied-to message
  if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
    return msg.message.extendedTextMessage.contextInfo.participant;
  }

  // Fallback to parsing the JID from arguments
  const text = args.join(' ');
  if (text) {
    const numberMatch = text.replace(/[^0-9]/g, '');
    if (numberMatch) {
      return `${numberMatch}@s.whatsapp.net`;
    }
  }

  return null; // Return null if no user is found
}

/**
 * Formats a number of bytes into a human-readable string.
 * @param {number} bytes The number of bytes.
 * @param {number} decimals The number of decimal places to use.
 * @returns {string} The formatted string (e.g., "1.23 MB").
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Ensures a user object has all the necessary RPG fields to prevent errors.
 * This function modifies the user object directly (by reference).
 * @param {object} user The user object from the database.
 */
export function initializeRpgUser(user) {
  if (!user) return;

  // Initialize base stats if they don't exist
  if (user.maxHp === undefined) {
    user.maxHp = 100 + ((user.level - 1) * 10);
  }
  if (user.hp === undefined || user.hp > user.maxHp) {
    user.hp = user.maxHp;
  }
  if (user.profession === undefined) {
    user.profession = null;
  }
  if (!user.inventory) {
    user.inventory = {};
  }
  if (!user.equipment) {
    user.equipment = {};
  }

  // Initialize durability for existing equipment
  for (const itemType in user.equipment) {
    const item = user.equipment[itemType];
    // CRITICAL FIX: Ensure item is not null before accessing its properties.
    if (item) {
      if (item.durability === undefined) {
        item.durability = 100;
        item.maxDurability = 100;
      }
      if (item.level === undefined) {
        item.level = 1;
      }
    }
  }
}