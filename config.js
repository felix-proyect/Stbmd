/*
* Este es el archivo de configuración principal del bot.
* Modifica los valores según tus necesidades.
*/

const config = {
  // El nombre que mostrará el bot en los menús y mensajes.
  botName: "Gawr Gura",

  // El nombre del propietario del bot.
  ownerName: "𝓨𝓞 𝓢𝓞𝓨 𝓨𝓞 𝓦𝓐.ℳ𝓔/𝟓𝟕𝟑𝟏𝟑𝟑𝟑𝟕𝟒𝟏𝟑𝟐?𝓣𝓔𝓧𝓣=ℋ𝓞ℒ𝓐",

  // Tasa de impuestos para la economía (ej. 0.10 para 10%)
  taxRate: 0.19,

  // Números de los propietarios del bot (en formato de WhatsApp, ej: '18493907272').
  // El bot puede tener funcionalidades exclusivas para estos números.
  // Se añade el LID del propietario para asegurar el reconocimiento.
  ownerNumbers: ["573133374132", "176742836768966","51956931649"],

  // APIs (si las tienes, si no, déjalas como están)
  // No es necesario modificar estas si usas las APIs públicas de Adonix.
  api: {
    adonix: {
      baseURL: "https://myapiadonix.casacam.net",
      apiKey: "AdonixKeym3b8mi1061"
    },
    gemini: "AIzaSyDEww4IKqba9tgfb8ndMDBOoLkl-nSy4tw" // Tu API Key de Gemini
  },

  
  authDir: 'Itsuki Session'
};

export default config;
