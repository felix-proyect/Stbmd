import fs from "fs";
import path from "path";

const questions = [
  "¿Ser invisible o poder volar?",
  "¿Vivir sin música o sin películas?",
  "¿Saber la fecha de tu muerte o la causa de tu muerte?",
  "¿Tener más tiempo o más dinero?",
  "Hablar todos los idiomas o poder hablar con los animales?",
  "¿Ser famoso pero pobre o desconocido pero rico?",
  "¿Nunca volver a dormir o dormir 20 horas al día?",
  "¿Poder leer la mente o controlar el tiempo?",
  "¿Viajar al pasado o al futuro?",
  "¿Comer solo pizza o solo hamburguesas toda tu vida?",
  "¿No poder usar redes sociales o no poder usar tu móvil?",
  "¿Ser el mejor en tu trabajo o tener muchos amigos?",
  "¿Tener memoria fotográfica o poder olvidar lo que quieras?",
  "¿Ser joven para siempre o tener salud perfecta?",
  "¿Vivir en la ciudad o en el campo?",
  "¿Ser el líder o el seguidor?",
  "¿Poder hablar con animales o con plantas?",
  "¿Nunca sentir tristeza o nunca sentir miedo?",
  "¿Saber cuándo morirás o cómo morirás?",
  "¿Vivir sin internet o sin televisión?",
  "¿Viajar a la luna o al fondo del océano?",
  "¿Tener súper fuerza o súper velocidad?",
  "¿Ser increíblemente rico o increíblemente sabio?",
  "¿Ser famoso en internet o en la vida real?",
  "¿Comer dulces toda la vida o comida salada?",
  "¿Viajar solo o acompañado siempre?",
  "¿No volver a comer chocolate o no volver a comer pizza?",
  "¿Saber todos los secretos del mundo o tener mucho dinero?",
  "¿Vivir en invierno o en verano para siempre?",
  "¿Tener el poder de curar o de volar?",
  "¿Ser gigante o muy pequeño?",
  "¿Vivir sin música o sin películas?",
  "¿Ser inmortal pero aburrido o mortal y feliz?",
  "¿Nunca dormir o dormir mucho pero soñar siempre?",
  "¿Hablar solo la verdad o siempre mentir?",
  "¿Vivir sin amigos o sin familia?",
  "¿Ser un héroe o un villano famoso?",
  "¿Viajar en el tiempo o teletransportarte?",
  "¿Tener un coche de lujo o una casa increíble?",
  "¿Ser extremadamente inteligente o extremadamente atractivo?",
  "¿Tener solo un deseo o poder repetir deseos infinitos?",
  "¿Ser un genio en matemáticas o en música?",
  "¿Tener un superpoder útil o uno divertido?",
  "¿Ser súper rápido o súper fuerte?",
  "¿Poder leer pensamientos o controlar emociones?",
  "¿Vivir sin dolor físico o sin dolor emocional?",
  "¿Ser capaz de desaparecer o de volar?",
  "¿Tener todo el conocimiento o todo el dinero?",
  "¿Vivir en otra época o en otro planeta?",
  "¿Ser famoso en la historia o en el presente?",
  "¿No envejecer nunca o envejecer rápido pero feliz?",
  "¿Ser un actor famoso o un escritor famoso?",
  "¿Ser rico pero infeliz o pobre pero feliz?",
  "¿Nunca envejecer físicamente o mentalmente?",
  "¿Tener un millón de amigos o un amor verdadero?",
  "¿Ser invisible o leer la mente?",
  "¿Vivir en la playa o en la montaña?",
  "¿Volar o respirar bajo el agua?",
  "¿Poder cambiar tu pasado o tu futuro?",
  "¿Ser un héroe anónimo o un villano conocido?",
  "¿Tener suerte infinita o inteligencia infinita?",
  "¿Poder parar el tiempo o viajar en el tiempo?",
  "¿Tener alas o una cola prensil?",
  "¿Vivir solo en el espacio o en el fondo del mar?",
  "¿Ser joven eternamente o tener sabiduría eterna?",
  "¿Ser un maestro de todos los deportes o de todos los idiomas?",
  "¿Tener poderes mágicos o tecnología futurista?",
  "¿Ser amado por todos o temido por todos?",
  "¿Poder hablar con los muertos o ver el futuro?",
  "¿Vivir sin emociones o con emociones extremas siempre?",
  "¿Tener memoria infinita o creatividad infinita?",
  "¿Ser líder mundial o inventor famoso?",
  "¿Tener un clon que haga todo por ti o ser tú mismo siempre?",
  "¿Vivir en la ciudad del futuro o del pasado?",
  "¿Nunca equivocarte o tener suerte infinita?",
  "¿Tener un dragón o un unicornio?",
  "¿Vivir en la luna o en Marte?",
  "¿Ser capaz de controlar el clima o la mente de los demás?",
  "¿Ser invisible o intocable?",
  "¿Tener súper visión o súper oído?",
  "¿Ser un genio en todo o especializarte en una cosa?",
  "¿Ser un héroe en secreto o un villano sin ser atrapado?",
  "¿Poder hablar con extraterrestres o viajar a otro planeta?",
  "¿Vivir en la tierra o en otra dimensión?",
  "¿Ser capaz de cambiar de forma o de tamaño?",
  "¿Tener suerte infinita o amor verdadero?",
  "¿Nunca envejecer o tener salud perfecta siempre?",
  "¿Vivir en el futuro o en el pasado?",
  "¿Tener súper velocidad o súper fuerza?",
  "¿Ser el más inteligente o el más feliz?",
  "¿Ser rico o famoso?",
  "¿Poder cambiar tu destino o conocerlo?",
  "¿Ser temido o respetado?",
  "¿Tener un amigo fiel o un amor eterno?",
  "¿Vivir sin dolor o sin tristeza?",
  "¿Poder controlar elementos o mentes?",
  "¿Tener alas o brillar en la oscuridad?",
  "¿Ser un inventor o un explorador?",
  "¿Vivir sin miedo o sin preocupaciones?",
  "¿Poder hablar todos los idiomas o todos los dialectos antiguos?",
  "¿Ser invisible o tangible a voluntad?",
  "¿Volar o nadar a velocidades increíbles?",
  "¿Tener súper memoria o súper fuerza física?",
  "¿Poder crear cualquier cosa o destruir cualquier cosa?",
  "¿Tener 100 vidas o vivir una sola vida perfecta?",
  "¿Ser amado por todos o ser temido por todos?"
];

// Reacciones aleatorias
const reactions = [
  "🔥 Buena elección!",
  "😏 Interesante decisión.",
  "😂 Jajaja, eso estuvo divertido!",
  "💡 Muy inteligente!",
  "😱 Wow, no me lo esperaba!",
  "✨ Perfecto, sigue así!",
  "🙃 Curioso...",
  "💪 Eso es audaz!",
  "🌟 Elegancia pura!",
  "😎 Genial, me gusta!"
];

// Archivo para guardar historial por chat
const HISTORIAL_FILE = path.join(process.cwd(), "wyr_history.json");

// Cargar historial desde archivo
let chatHistory = {};
if (fs.existsSync(HISTORIAL_FILE)) {
  chatHistory = JSON.parse(fs.readFileSync(HISTORIAL_FILE, "utf-8"));
}

// Guardar historial en archivo
function saveHistory() {
  fs.writeFileSync(HISTORIAL_FILE, JSON.stringify(chatHistory, null, 2));
}

const wyrCommand = {
  name: "wouldyourather",
  category: "diversion",
  description: "Te da una pregunta de '¿Qué prefieres?' y reacciona a tu elección, sin repetir hasta que se agoten todas.",
  aliases: ["wyr", "queprefieres"],

  async execute({ sock, msg, args }) {
    const chat = msg.key.remoteJid;

    // Si el usuario responde a la pregunta anterior
    if (args.length > 0) {
      const userAnswer = args.join(" ");
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      const reply = `🤔 Tu elección: *${userAnswer}*\n${randomReaction}`;
      return await sock.sendMessage(chat, { text: reply }, { quoted: msg });
    }

    // Inicializar historial para este chat si no existe
    if (!chatHistory[chat]) chatHistory[chat] = [];

    // Filtrar preguntas que ya se enviaron
    let availableQuestions = questions.filter(q => !chatHistory[chat].includes(q));

    // Si ya se mostraron todas, reiniciamos el historial
    if (availableQuestions.length === 0) {
      chatHistory[chat] = [];
      availableQuestions = [...questions];
    }

    // Tomamos pregunta aleatoria del historial disponible
    const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    chatHistory[chat].push(randomQuestion); // Agregar al historial
    saveHistory();

    const decoraciones = [
      "💭✨🌸🌟",
      "🌈💬🎭💞",
      "💫🌻🧠🌙",
      "🎲🎯🌹🩵",
      "🌠💭🌷🧩"
    ];
    const deco = decoraciones[Math.floor(Math.random() * decoraciones.length)];

    const message = `${deco}\n*💭 ¿Qué prefieres? 💭*\n${deco}\n\n${randomQuestion}\n\n🤔 Responde escribiendo tu elección.`;

    await sock.sendMessage(chat, { text: message }, { quoted: msg });
  }
};

export default wyrCommand;
