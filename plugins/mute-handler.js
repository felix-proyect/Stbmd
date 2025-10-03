import { readSettingsDb } from '../lib/database.js';
import { areJidsSameUser } from '@whiskeysockets/baileys';

const muteHandler = {
  name: "mute-handler",
  isAutoHandler: true,

  async execute({ sock, msg }) {
    const from = msg.key.remoteJid;
    const senderId = msg.sender;

    if (!from.endsWith('@g.us') || !senderId) return;

    try {
      const settings = readSettingsDb();
      const mutedUsers = settings[from]?.mutedUsers;

      if (!mutedUsers || mutedUsers.length === 0) {
        return; // No users are muted in this group
      }

      const isMuted = mutedUsers.some(mutedJid => areJidsSameUser(mutedJid, senderId));

      if (isMuted) {
        // We can add a check here to ensure we don't delete messages from admins, as a safeguard
        const metadata = await sock.groupMetadata(from);
        const senderIsAdmin = metadata.participants.some(p => areJidsSameUser(p.id, senderId) && p.admin);

        if (senderIsAdmin) {
          // This is a safeguard. An admin should not be in the muted list,
          // but if they are, we should not delete their messages.
          // Optionally, we could also remove them from the muted list here.
          return;
        }

        // Delete the message from the muted user
        await sock.sendMessage(from, { delete: msg.key });
      }
    } catch (error) {
      console.error("Error in mute-handler:", error);
    }
  }
};

export default muteHandler;