import fetch from "node-fetch";

const covidCommand = {
  name: "covid",
  category: "informacion",
  description: "Muestra estadísticas actualizadas de COVID-19 (por país o globales).",
  aliases: ["covid19", "corona"],

  async execute({ sock, msg, args }) {
    const country = args.join(' ') || "global";
    const baseUrl = "https://disease.sh/v3/covid-19";

    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: "🦠", key: msg.key },
    });

    try {
      let url;
      if (country.toLowerCase() === "global") {
        url = `${baseUrl}/all`;
      } else {
        url = `${baseUrl}/countries/${encodeURIComponent(country)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo obtener información.");
      const data = await res.json();

      if (data.message || !data.cases) {
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key },
        });
        return sock.sendMessage(
          msg.key.remoteJid,
          { text: `❌ No se encontraron datos para *${country}*.` },
          { quoted: msg }
        );
      }

      const covidText = `
🌍 *Estadísticas COVID-19 - ${country.toUpperCase()}*

📅 *Actualizado:* ${new Date(data.updated).toLocaleString('es-ES')}
🧍‍♂️ *Casos totales:* ${data.cases.toLocaleString()}
⚰️ *Fallecidos:* ${data.deaths.toLocaleString()}
💪 *Recuperados:* ${data.recovered.toLocaleString()}
🆕 *Casos hoy:* ${data.todayCases.toLocaleString()}
☠️ *Muertes hoy:* ${data.todayDeaths.toLocaleString()}
💉 *Vacunados:* ${(data.population && data.tests ? data.tests.toLocaleString() : 'No disponible')}
👨‍👩‍👧 *Población:* ${data.population?.toLocaleString() || 'Desconocida'}

🔗 Fuente: disease.sh
`;

      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "✅", key: msg.key },
      });

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: covidText.trim() },
        { quoted: msg }
      );
    } catch (error) {
      console.error("Error al obtener datos de COVID:", error);
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "❌", key: msg.key },
      });
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Error al obtener los datos de COVID-19." },
        { quoted: msg }
      );
    }
  },
};

export default covidCommand;
