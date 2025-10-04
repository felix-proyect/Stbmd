# Bot de WhatsApp con Baileys y Sistema de Plugins

¡Bienvenido! Este es un bot de WhatsApp modular y fácil de expandir, construido con `@whiskeysockets/baileys`. La principal característica es su sistema de comandos basado en plugins, donde cada comando es un archivo independiente en la carpeta `plugins`.

Este bot incluye un **sistema de RPG avanzado** con crafteo, profesiones, combate y mucho más.

## Características Principales

- **Sistema de Plugins:** Cada comando es un módulo en la carpeta `plugins`, lo que facilita añadir o quitar funcionalidades.
- **Menú Dinámico:** El comando `menu` se genera automáticamente a partir de los plugins existentes.
- **Sistema RPG Completo:** Incluye profesiones, crafteo, mejora y reparación de ítems, durabilidad, combate y economía.
- **Configuración Sencilla:** Personaliza el nombre del bot y del propietario en `config.js`.

---

## Sistema RPG Avanzado

El bot cuenta con un sistema de rol (RPG) donde puedes luchar, recolectar recursos, fabricar equipamiento y especializarte en una profesión.

### Comandos Principales del RPG

| Comando | Alias | Descripción |
| :--- | :--- | :--- |
| `reg` | `registrar` | Te registra en el mundo del RPG. |
| `profile` | `stats`, `perfil` | Muestra tu perfil de personaje completo. |
| `inventory` | `inv` | Muestra tu equipamiento, objetos y recursos. |
| `hunt` | `cazar` | Caza criaturas para ganar XP, monedas y arriesgar tu equipo. |
| `mine` | `minar` | Extrae recursos de la mina. |
| `professions` | `profesion` | Elige o consulta información sobre tu profesión. |
| `blacksmith`| `herrero` | El comando central para fabricar, mejorar y reparar equipo. |
| `heal` | `curar` | Usa una poción para recuperar HP. |

### Guía de Herrería (`blacksmith`)

Este es el comando principal para todo lo relacionado con tu equipamiento.

- **`.blacksmith list`**: Muestra una lista de todos los objetos que se pueden fabricar.
- **`.blacksmith craft <item>`**: Fabrica un objeto. Consume recursos.
- **`.blacksmith upgrade <item>`**: Intenta mejorar un objeto. Consume recursos y tiene una probabilidad de fallo.
- **`.blacksmith repair <item>`**: Repara un objeto dañado, restaurando su durabilidad. Consume recursos.
- **`.blacksmith info`**: Muestra tu equipamiento actual con sus estadísticas y durabilidad.

### Durabilidad y Combate

- Tu equipamiento (armas, armaduras) tiene **durabilidad**.
- Al usar el comando `.hunt`, tu equipo perderá durabilidad.
- Si la durabilidad de un objeto llega a 0, se rompe y no te dará ninguna de sus estadísticas hasta que lo repares con `.blacksmith repair`.
- El éxito en la caza y el daño que recibes dependen de tu **Fuerza** y **Defensa** total, incluyendo las bonificaciones de tu equipo.

### Profesiones

Puedes elegir una profesión para obtener bonificaciones especiales. ¡La elección es permanente!

- **`.professions list`**: Muestra las profesiones disponibles.
- **`.professions choose <nombre>`**: Elige tu profesión.

| Profesión | Bonificaciones |
| :--- | :--- |
| **Herrero (`blacksmith`)** | - 20% de descuento en recursos para fabricar y mejorar.<br>- 30% de descuento en recursos para reparar.<br>- +10% de probabilidad de éxito al mejorar equipamiento. |
| **Minero (`miner`)** | - 50% más de recursos básicos (piedra, carbón).<br>- Mayor probabilidad de encontrar recursos raros (hierro, oro, mithril). |

### Recursos y Materiales

Estos son los materiales que puedes obtener y usar para fabricar y mejorar.

| Recurso | Se obtiene en |
| :--- | :--- |
| Piedra (`stone`) | `.mine` |
| Carbón (`coal`) | `.mine` |
| Hierro (`iron`) | `.mine` (raro) |
| Oro (`gold`) | `.mine` (muy raro) |
| Mithril (`mithril`)| `.mine` (extremadamente raro) |
| Diamantes (`diamonds`)| `.mine` (mejora de ítems) |

### Equipamiento Fabricable

| Objeto | ID para craftear | Coste de Fabricación | Estadísticas Base |
| :--- | :--- | :--- | :--- |
| Espada de Hierro | `sword` | 20 Piedra, 10 Carbón, 10 Hierro | +5 Fuerza |
| Armadura de Hierro | `armor` | 30 Hierro, 15 Carbón | +5 Defensa |
| Espada Dorada | `gilded_sword` | 20 Hierro, 5 Oro, 1 Diamante | +15 Fuerza |
| Armadura de Mithril|`mithril_armor`| 10 Hierro, 5 Mithril, 1 Diamante | +20 Defensa |

---

## Instalación y Uso

### Requisitos
- Node.js (versión 18 o superior recomendada)

### Cómo Ejecutar el Bot
1.  **Clona o descarga este repositorio.**
2.  **Abre una terminal en la carpeta del proyecto.**
3.  **Instala las dependencias:**
    ```bash
    npm install
    ```
4.  **Configura tus datos:** Abre el archivo `config.js` y modifica los valores de `botName` y `ownerName`.
5.  **Inicia el bot:**
    ```bash
    node index.js
    ```
6.  **Escanea el QR:** La primera vez que lo ejecutes, aparecerá un código QR en tu terminal. Escanéalo con tu teléfono desde WhatsApp (en `Dispositivos Vinculados`).

---

## Cómo Crear un Nuevo Comando

Crear tus propios comandos es muy fácil. Solo tienes que añadir un nuevo archivo `.js` en la carpeta `plugins`.

**Estructura básica de un comando:**

```javascript
const miComando = {
  name: "nombrecomando",
  category: "categoría",
  description: "Esto es lo que hace mi comando.",
  aliases: ["alias1", "alias2"],

  async execute({ sock, msg, args }) {
    // Aquí va la lógica de tu comando.
    await sock.sendMessage(msg.key.remoteJid, { text: "¡Mi nuevo comando funciona!" }, { quoted: msg });
  }
};

export default miComando;
```