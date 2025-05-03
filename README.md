# UNO Online

Un juego de UNO multijugador en tiempo real construido con Next.js, Socket.IO y TypeScript.

## Características

- 🎮 Juego completo de UNO con todas las cartas y reglas
- 🌐 Multijugador en tiempo real
- 💬 Chat integrado
- 🔔 Notificaciones y efectos de sonido
- ⏱️ Temporizador de turnos
- 🎨 Interfaz moderna y responsive
- 🎵 Efectos de sonido
- 📱 Diseño adaptable para móviles

## Requisitos

- Node.js 18.0 o superior
- npm 7.0 o superior

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd uno
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Cómo jugar

1. Ingresa tu nombre y crea un nuevo juego o únete a uno existente usando el ID del juego.
2. Comparte el ID del juego con tus amigos para que puedan unirse.
3. El juego comenzará cuando se unan todos los jugadores.
4. En tu turno:
   - Juega una carta que coincida en color o número con la carta actual
   - Usa cartas especiales (Skip, Reverse, Draw Two, Wild, Wild Draw Four)
   - Si no puedes jugar, roba una carta
   - ¡No olvides decir "UNO" cuando te quede una carta!

## Reglas especiales

- Puedes apilar cartas +2 y +4
- Tienes 30 segundos por turno
- Si se acaba el tiempo, robarás una carta automáticamente
- Puedes jugar después de robar si tienes una carta válida

## Tecnologías utilizadas

- Next.js 14
- Socket.IO
- TypeScript
- Tailwind CSS
- Framer Motion

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
