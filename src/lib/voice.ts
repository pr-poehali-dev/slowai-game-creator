// Озвучка текста (Text-to-Speech) через встроенный синтезатор браузера
export function speak(text: string, lang: string, voiceName?: string, rate = 1, pitch = 1) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const langMap: Record<string, string> = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', zh: 'zh-CN' };
  u.lang = langMap[lang] || 'ru-RU';
  u.rate = rate;
  u.pitch = pitch;
  const voices = window.speechSynthesis.getVoices();
  if (voiceName) {
    const v = voices.find((x) => x.name === voiceName);
    if (v) u.voice = v;
  } else {
    const v = voices.find((x) => x.lang.startsWith(u.lang.split('-')[0]));
    if (v) u.voice = v;
  }
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeak() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function getVoices(): SpeechSynthesisVoice[] {
  return 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [];
}

// Распознавание речи (Speech-to-Text)
type RecResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SR = { start: () => void; stop: () => void; onresult: ((e: RecResult) => void) | null; onend: (() => void) | null; lang: string; interimResults: boolean; continuous: boolean };

export function createRecognition(lang: string): SR | null {
  const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  const Rec = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!Rec) return null;
  const r: SR = new Rec();
  const langMap: Record<string, string> = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', zh: 'zh-CN' };
  r.lang = langMap[lang] || 'ru-RU';
  r.interimResults = false;
  r.continuous = false;
  return r;
}

// Скачивание файла-заглушки результата генерации на устройство
export function downloadGeneration(modeId: string, prompt: string) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  if (modeId === 'image') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#06b6d4"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/><text x="50%" y="48%" fill="#fff" font-size="34" font-family="sans-serif" text-anchor="middle">SlowAISkk</text><text x="50%" y="56%" fill="#fff" font-size="20" font-family="sans-serif" text-anchor="middle" opacity="0.85">${escapeXml(prompt).slice(0, 60)}</text></svg>`;
    save(new Blob([svg], { type: 'image/svg+xml' }), `slowaiskk-photo-${stamp}.svg`);
    return;
  }
  if (modeId === 'music') {
    save(makeWav(4, prompt.length), `slowaiskk-music-${stamp}.wav`);
    return;
  }
  if (modeId === 'game') {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>SlowAISkk Game</title><style>body{margin:0;background:#0b0b16;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column}h1{background:linear-gradient(90deg,#a855f7,#06b6d4);-webkit-background-clip:text;color:transparent}</style></head><body><h1>Моя игра</h1><p>${escapeXml(prompt)}</p><p>Сделано в SlowAISkk</p></body></html>`;
    save(new Blob([html], { type: 'text/html' }), `slowaiskk-game-${stamp}.html`);
    return;
  }
  // video / other -> текстовый сценарий
  const txt = `SlowAISkk — результат генерации (${modeId})\n\nЗапрос: ${prompt}\n\nДата: ${new Date().toLocaleString()}`;
  save(new Blob([txt], { type: 'text/plain' }), `slowaiskk-${modeId}-${stamp}.txt`);
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

// генерируем короткий WAV-бип как «трек»
function makeWav(seconds: number, seed: number): Blob {
  const sampleRate = 8000;
  const total = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + total * 2);
  const view = new DataView(buffer);
  const w = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); view.setUint32(4, 36 + total * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); w(36, 'data'); view.setUint32(40, total * 2, true);
  const base = 220 + (seed % 12) * 30;
  for (let i = 0; i < total; i++) {
    const note = base * (1 + 0.25 * Math.floor((i / sampleRate) * 2) % 4);
    const v = Math.sin((2 * Math.PI * note * i) / sampleRate) * 0.3 * Math.exp(-(i % sampleRate) / sampleRate);
    view.setInt16(44 + i * 2, v * 32767, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}