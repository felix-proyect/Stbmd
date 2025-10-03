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