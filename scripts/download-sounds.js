const https = require('https');
const fs = require('fs');
const path = require('path');

const sounds = {
  'play-card.mp3': 'https://cdn.freesound.org/previews/240/240776_4107740-lq.mp3',
  'draw-card.mp3': 'https://cdn.freesound.org/previews/240/240777_4107740-lq.mp3',
  'game-win.mp3': 'https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3',
  'uno.mp3': 'https://cdn.freesound.org/previews/434/434462_8386243-lq.mp3',
  'message.mp3': 'https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3'
};

const soundsDir = path.join(__dirname, '../public/sounds');

if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

Object.entries(sounds).forEach(([filename, url]) => {
  const filePath = path.join(soundsDir, filename);
  https.get(url, (response) => {
    const fileStream = fs.createWriteStream(filePath);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      console.log(`Downloaded: ${filename}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${filename}:`, err.message);
  });
}); 