/**
 * Normalizes a JID by removing any non-digit characters before the '@'.
 * This is useful for comparing JIDs that may or may not have LIDs.
 * e.g., `12345:12@s.whatsapp.net` -> `12345@s.whatsapp.net`
 * @param {string} jid The JID to normalize.
 * @returns {string} The normalized JID.
 */
export function normalizeJid(jid) {
  if (!jid || typeof jid !== 'string') {
    return jid;
  }
  const [user, server] = jid.split('@');
  if (!server) {
    return jid; // Not a valid JID format
  }
  // Remove LID by splitting at the colon
  const sanitizedUser = user.split(':')[0];
  return `${sanitizedUser}@${server}`;
}

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