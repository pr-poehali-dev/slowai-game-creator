export type Lang = 'ru' | 'en' | 'es' | 'de' | 'fr' | 'zh';

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'de', label: 'Deutsch' },
  { id: 'fr', label: 'Français' },
  { id: 'zh', label: '中文' },
];

const ru = {
  greeting: 'Привет, я',
  subtitle: 'Умный ИИ: отвечу на вопросы, посчитаю, придумаю текст, создам игру, фото, видео и музыку. Можно говорить голосом.',
  modes: 'Режимы',
  profile: 'Профиль',
  settings: 'Настройки',
  support: 'Поддержка',
  openCreateGame: 'Открыть Create Game',
  login: 'Войти',
  register: 'Регистрация',
  logout: 'Выйти',
  name: 'Имя',
  email: 'Почта',
  password: 'Пароль',
  haveAccount: 'Уже есть аккаунт? Войти',
  noAccount: 'Нет аккаунта? Зарегистрироваться',
  loginTitle: 'Вход в SlowAISkk',
  registerTitle: 'Создать аккаунт',
  loginToChat: 'Войди, чтобы общаться с ИИ и сохранять прогресс.',
  generating: 'Генерирую',
  timeLeft: 'осталось',
  ready: 'Готово! Файл можно скачать',
  download: 'Скачать на устройство',
  thinking: 'SlowAISkk печатает…',
  language: 'Язык',
  theme: 'Тема',
  notifications: 'Уведомления',
  sound: 'Звук генерации',
  voiceReply: 'Голосовые ответы',
  voice: 'Голос ассистента',
  speed: 'Скорость речи',
  on: 'Вкл',
  off: 'Выкл',
  dark: 'Тёмная',
  light: 'Светлая',
  send: 'Отправить',
  saved: 'Настройки сохранены',
  errEmail: 'Эта почта уже занята',
  errCreds: 'Неверная почта или пароль',
  errFields: 'Заполни все поля (пароль от 4 символов)',
  listen: 'Озвучить',
  stop: 'Стоп',
  listening: 'Слушаю…',
  micDenied: 'Нет доступа к микрофону',
  micUnsupported: 'Голосовой ввод не поддерживается в этом браузере',
};

const en: typeof ru = {
  greeting: 'Hi, I am',
  subtitle: 'Smart AI: I answer questions, calculate, write texts, create games, photos, videos and music. You can talk by voice.',
  modes: 'Modes', profile: 'Profile', settings: 'Settings', support: 'Support',
  openCreateGame: 'Open Create Game', login: 'Log in', register: 'Sign up', logout: 'Log out',
  name: 'Name', email: 'Email', password: 'Password',
  haveAccount: 'Already have an account? Log in', noAccount: 'No account? Sign up',
  loginTitle: 'Log in to SlowAISkk', registerTitle: 'Create account',
  loginToChat: 'Log in to chat with AI and save your progress.',
  generating: 'Generating', timeLeft: 'left', ready: 'Done! You can download the file', download: 'Download to device',
  thinking: 'SlowAISkk is typing…', language: 'Language', theme: 'Theme', notifications: 'Notifications', sound: 'Generation sound',
  voiceReply: 'Voice replies', voice: 'Assistant voice', speed: 'Speech speed',
  on: 'On', off: 'Off', dark: 'Dark', light: 'Light', send: 'Send', saved: 'Settings saved',
  errEmail: 'This email is already taken', errCreds: 'Wrong email or password', errFields: 'Fill all fields (password 4+ chars)',
  listen: 'Speak', stop: 'Stop', listening: 'Listening…', micDenied: 'No microphone access', micUnsupported: 'Voice input not supported in this browser',
};

const es: typeof ru = { ...en,
  greeting: 'Hola, soy', subtitle: 'IA inteligente: respondo, calculo, escribo textos, creo juegos, fotos, videos y música. Puedes hablar por voz.',
  modes: 'Modos', profile: 'Perfil', settings: 'Ajustes', support: 'Soporte', login: 'Entrar', register: 'Registrarse', logout: 'Salir',
  name: 'Nombre', email: 'Correo', password: 'Contraseña', language: 'Idioma', theme: 'Tema', notifications: 'Notificaciones',
  sound: 'Sonido', voiceReply: 'Respuestas por voz', voice: 'Voz del asistente', speed: 'Velocidad', download: 'Descargar', send: 'Enviar', saved: 'Ajustes guardados',
};

const de: typeof ru = { ...en,
  greeting: 'Hallo, ich bin', subtitle: 'Kluge KI: Ich antworte, rechne, schreibe Texte, erstelle Spiele, Fotos, Videos und Musik. Du kannst sprechen.',
  modes: 'Modi', profile: 'Profil', settings: 'Einstellungen', support: 'Support', login: 'Anmelden', register: 'Registrieren', logout: 'Abmelden',
  name: 'Name', email: 'E-Mail', password: 'Passwort', language: 'Sprache', theme: 'Thema', notifications: 'Mitteilungen',
  sound: 'Ton', voiceReply: 'Sprachantworten', voice: 'Assistentenstimme', speed: 'Geschwindigkeit', download: 'Herunterladen', send: 'Senden', saved: 'Gespeichert',
};

const fr: typeof ru = { ...en,
  greeting: 'Salut, je suis', subtitle: 'IA intelligente : je réponds, calcule, écris des textes, crée jeux, photos, vidéos et musique. Tu peux parler.',
  modes: 'Modes', profile: 'Profil', settings: 'Paramètres', support: 'Support', login: 'Connexion', register: "S'inscrire", logout: 'Quitter',
  name: 'Nom', email: 'E-mail', password: 'Mot de passe', language: 'Langue', theme: 'Thème', notifications: 'Notifications',
  sound: 'Son', voiceReply: 'Réponses vocales', voice: 'Voix', speed: 'Vitesse', download: 'Télécharger', send: 'Envoyer', saved: 'Enregistré',
};

const zh: typeof ru = { ...en,
  greeting: '你好，我是', subtitle: '智能AI：回答问题、计算、写作、生成游戏、图片、视频和音乐。可以语音交流。',
  modes: '模式', profile: '个人', settings: '设置', support: '支持', login: '登录', register: '注册', logout: '退出',
  name: '名字', email: '邮箱', password: '密码', language: '语言', theme: '主题', notifications: '通知',
  sound: '声音', voiceReply: '语音回复', voice: '助手声音', speed: '语速', download: '下载', send: '发送', saved: '已保存',
};

export const TRANSLATIONS = { ru, en, es, de, fr, zh } as const;

export type TKey = keyof typeof ru;

export const t = (lang: Lang, key: TKey): string => (TRANSLATIONS[lang] || TRANSLATIONS.ru)[key];
