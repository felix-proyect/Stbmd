const { proto } = require('@whiskeysockets/baileys');

module.exports = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(
      `🔧 *Prueba de formatos disponibles*  
Escribe:  *cmd <modo>*  
Modos disponibles:
- *boton1*
- *boton2*
- *lista*
- *imagen*
- *gif*
- *sticker*
- *audio*
- *musica*
- *video*
- *documento*
- *ubicacion*
- *contacto*
- *evento*

Ejemplo:  *cmd boton1*`
    );
  }

  let modo = text.trim().toLowerCase();

  try {
    switch (modo) {

      // 🟢 BOTONES CON REPLY BUTTONS (estilo clásico)
      case 'boton1':
        await conn.sendMessage(m.chat, {
          text: '🟦 *Botón de prueba 1*',
          buttons: [
            { buttonId: 'test1', buttonText: { displayText: '🔹 Opción A' }, type: 1 },
            { buttonId: 'test2', buttonText: { displayText: '🔸 Opción B' }, type: 1 }
          ],
          headerType: 1
        });
        break;

      // 🔵 BOTONES CON TEMPLATE BUTTONS
      case 'boton2':
        await conn.sendMessage(m.chat, {
          text: '🎛 *Botones estilo template*',
          footer: 'Gawr Gura System',
          templateButtons: [
            { index: 1, quickReplyButton: { id: 'tpl1', displayText: '✨ Template 1' } },
            { index: 2, quickReplyButton: { id: 'tpl2', displayText: '💫 Template 2' } }
          ]
        });
        break;

      // 📋 LISTA SIMPLE
      case 'lista':
        await conn.sendMessage(m.chat, {
          text: '📋 *Lista de prueba*',
          footer: 'Gawr Gura System',
          title: '🌀 Selecciona una opción',
          buttonText: 'Abrir lista',
          sections: [
            {
              title: 'Opciones disponibles',
              rows: [
                { title: '🔥 Opción 1', rowId: 'lista1' },
                { title: '🌊 Opción 2', rowId: 'lista2' },
                { title: '🐬 Opción 3', rowId: 'lista3' }
              ]
            }
          ]
        });
        break;

      // 🖼 IMAGEN GAWR GURA
      case 'imagen':
        await conn.sendMessage(m.chat, {
          image: { url: 'https://i.imgur.com/8fK4hK9.jpeg' },
          caption: '🖼 *Imagen temática de Gawr Gura enviada correctamente*'
        });
        break;

      // 🎭 GIF DESDE URL
      case 'gif':
        await conn.sendMessage(m.chat, {
          video: { url: 'https://i.imgur.com/0Ztwgk9.mp4' },
          gifPlayback: true,
          caption: '🎭 *GIF animado de prueba*'
        });
        break;

      // 🎴 STICKER
      case 'sticker':
        await conn.sendMessage(m.chat, {
          sticker: { url: 'https://i.imgur.com/jJ8ZgYs.png' }
        });
        break;

      // 🎤 AUDIO TIPO NOTA DE VOZ
      case 'audio':
        await conn.sendMessage(m.chat, {
          audio: { url: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav' },
          ptt: true
        });
        break;

      // 🎧 AUDIO TIPO MÚSICA
      case 'musica':
        await conn.sendMessage(m.chat, {
          audio: { url: 'https://file-examples.com/storage/fe1da5bad7fb5b9a9d3cd52/2017/11/file_example_MP3_700KB.mp3' },
          mimetype: 'audio/mpeg'
        });
        break;

      // 🎬 VIDEO
      case 'video':
        await conn.sendMessage(m.chat, {
          video: { url: 'https://file-examples.com/storage/fe1da5bad7fb5b9a9d3cd52/2017/04/file_example_MP4_480_1_5MG.mp4' },
          caption: '🎬 *Video de prueba enviado*'
        });
        break;

      // 📎 DOCUMENTO
      case 'documento':
        await conn.sendMessage(m.chat, {
          document: { url: 'https://file-examples.com/wp-content/storage/2017/10/file-example_PDF_1MB.pdf' },
          fileName: 'Gawr_Gura_Test.pdf',
          mimetype: 'application/pdf'
        });
        break;

      // 📍 UBICACIÓN
      case 'ubicacion':
        await conn.sendMessage(m.chat, {
          location: {
            degreesLatitude: 35.6895,
            degreesLongitude: 139.6917
          }
        });
        break;

      // 📇 CONTACTO
      case 'contacto':
        await conn.sendMessage(m.chat, {
          contacts: {
            displayName: 'Gawr Gura',
            contacts: [{ vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN:Gawr Gura\nTEL;type=CELL;type=VOICE;waid=00000000000:+00000000000\nEND:VCARD' }]
          }
        });
        break;

      // 🎉 EVENTO
      case 'evento':
        await conn.sendMessage(m.chat, {
          text: '🎉 *Evento de prueba creado*'
        });
        break;

      default:
        return m.reply('❌ *Modo no reconocido*');
    }

    // ✅ CONFIRMACIÓN
    m.reply(`✅ *${modo.toUpperCase()} enviado correctamente*`);

  } catch (e) {
    console.log(e);
    m.reply('⚠ Error enviando este tipo de mensaje. Puede que este cliente no lo soporte.');
  }
};

module.exports.command = ['cmd'];
module.exports.tags = ['test'];
module.exports.help = ['cmd <modo>'];
