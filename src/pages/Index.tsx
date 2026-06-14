import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Lang, t, LANGUAGES } from '@/lib/i18n';
import { User, ChatMessage, register, login, getMe, saveSettings, askAI } from '@/lib/api';
import { speak, stopSpeak, getVoices, createRecognition, downloadGeneration } from '@/lib/voice';

const LOGO = 'https://cdn.poehali.dev/projects/fe189c7a-586e-4b69-ab19-ed54c04dfaf1/files/efc278ff-1a15-485e-9e1e-6b653ccc1f01.jpg';

type Mode = { id: string; title: string; icon: string; color: string; placeholder: string; gen: boolean };

const MODES: Mode[] = [
  { id: 'chat', title: 'Умный чат', icon: 'MessageSquare', color: 'from-violet-500 to-purple-600', placeholder: 'Спроси что угодно: 2+2, реши задачу, объясни тему…', gen: false },
  { id: 'game', title: 'Create Game', icon: 'Gamepad2', color: 'from-fuchsia-500 to-pink-600', placeholder: 'Опиши игру: платформер с прыжками и сменой погоды…', gen: true },
  { id: 'image', title: 'Генерация фото', icon: 'Image', color: 'from-cyan-400 to-blue-500', placeholder: 'Опиши картинку: космонавт на неоновой планете…', gen: true },
  { id: 'video', title: 'Короткие видео', icon: 'Video', color: 'from-emerald-400 to-teal-500', placeholder: 'Опиши видео: пролёт камеры над футуристичным городом…', gen: true },
  { id: 'music', title: 'Музыка', icon: 'Music', color: 'from-amber-400 to-orange-500', placeholder: 'Опиши музыку: энергичный синтвейв для игры…', gen: true },
];

const SUPPORT = [
  { id: 'gmail', label: 'Почта (Gmail)', value: 'hypegoshop90@gmail.com', icon: 'Mail', color: 'bg-red-500', href: 'mailto:hypegoshop90@gmail.com' },
  { id: 'wa', label: 'WhatsApp', value: '+7 904 374 83 13', icon: 'MessageCircle', color: 'bg-green-500', href: 'https://wa.me/79043748313' },
  { id: 'tg', label: 'Telegram', value: '+7 904 374 83 13', icon: 'Send', color: 'bg-sky-500', href: 'https://t.me/+79043748313' },
];

type Msg = {
  role: 'user' | 'ai';
  text: string;
  support?: boolean;
  generating?: { mode: string; total: number };
  done?: { mode: string; title: string; prompt: string };
};

const GEN_LABELS: Record<string, string> = { image: 'фото', video: 'видео', music: 'трек', game: 'игру' };

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [section, setSection] = useState<'chat' | 'profile' | 'settings'>('chat');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recRef = useRef<ReturnType<typeof createRecognition>>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // auth
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('slowai_token'));
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authBusy, setAuthBusy] = useState(false);

  const lang: Lang = (user?.settings?.language as Lang) || (localStorage.getItem('slowai_lang') as Lang) || 'ru';
  const tr = (k: Parameters<typeof t>[1]) => t(lang, k);
  const voiceOn = user?.settings?.voiceReply ?? false;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  // auto-login on load
  useEffect(() => {
    if (token) {
      getMe(token).then(({ status, data }) => {
        if (status === 200) setUser(data.user);
        else { localStorage.removeItem('slowai_token'); setToken(null); }
      });
    }
  }, []);

  // загрузка голосов синтезатора
  useEffect(() => {
    const load = () => setVoices(getVoices());
    load();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const pushAI = (msg: Msg) => {
    setMessages((m) => [...m, msg]);
    if (voiceOn && msg.text && !msg.generating) {
      speak(msg.text, lang, user?.settings?.voice, user?.settings?.speed ?? 1);
    }
  };

  const sayText = (text: string) => speak(text, lang, user?.settings?.voice, user?.settings?.speed ?? 1);

  const localReply = (text: string): Msg | null => {
    const lt = text.toLowerCase().trim();
    if (lt.includes('поддерж') || lt.includes('связаться') || lt.includes('support')) {
      return { role: 'ai', text: 'Вот как со мной можно связаться — выбери удобный канал:', support: true };
    }
    // приветствия / прощания
    if (/^(привет|здаров|здравствуй|хай|hello|hi|hey)\b/.test(lt)) {
      return { role: 'ai', text: 'Привет! 👋 Я SlowAISkk. Чем помочь — посчитать, придумать текст, объяснить тему или создать игру, фото, видео и музыку?' };
    }
    if (/^(пока|до свидания|bye|goodbye|увидимся)\b/.test(lt)) {
      return { role: 'ai', text: 'Пока! 👋 Возвращайся, если что — буду рад помочь!' };
    }
    if (/(как тебя зовут|твоё имя|твое имя|who are you|кто ты)/.test(lt)) {
      return { role: 'ai', text: 'Я SlowAISkk — твой умный ИИ-ассистент. Могу считать, писать тексты, отвечать на вопросы и создавать контент.' };
    }
    // время и дата на устройстве
    const loc = lang === 'ru' ? 'ru-RU' : lang === 'zh' ? 'zh-CN' : lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US';
    if (/(сколько (сейчас )?врем|который час|what time|текущее время)/.test(lt)) {
      return { role: 'ai', text: `Сейчас на твоём устройстве ${new Date().toLocaleTimeString(loc)}.` };
    }
    if (/(какое (сегодня )?число|какой сегодня день|what.*date|сегодняшняя дата)/.test(lt)) {
      return { role: 'ai', text: `Сегодня ${new Date().toLocaleDateString(loc, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.` };
    }
    // математика: символы и слова
    const expr = lt
      .replace(/умнож(ь|ить|им)?( на)?|times|multipl\w*|\bна\b/g, '*')
      .replace(/раздел(и|ить|им)?( на)?|divide\w*|делённое|деленное/g, '/')
      .replace(/прибав(ь|ить|им)?|плюс|сложи\w*|add|plus/g, '+')
      .replace(/отними|отнять|вычти\w*|минус|minus|subtract\w*/g, '-')
      .replace(/сколько будет|посчитай|вычисли|чему равно|equals?|=/g, '')
      .replace(/[?]/g, '')
      .replace(/,/g, '.');
    const m = expr.replace(/\s/g, '').match(/^(-?\d+(?:\.\d+)?)([+\-*/])(-?\d+(?:\.\d+)?)$/);
    if (m) {
      const a = parseFloat(m[1]); const op = m[2]; const b = parseFloat(m[3]);
      if (op === '/' && b === 0) return { role: 'ai', text: 'На ноль делить нельзя 🙂' };
      const r = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
      return { role: 'ai', text: `${a} ${op} ${b} = ${Number(r.toFixed(6))}` };
    }
    return null;
  };

  const runGeneration = (genMode: Mode, idx: number, prompt: string) => {
    const total = genMode.id === 'video' ? 18 : genMode.id === 'game' ? 15 : genMode.id === 'music' ? 12 : 8;
    let left = total;
    const tick = setInterval(() => {
      left -= 1;
      setMessages((prev) => prev.map((m, i) => i === idx ? { ...m, generating: { mode: genMode.id, total: left } } : m));
      if (left <= 0) {
        clearInterval(tick);
        const doneText = `Готово! Твой ${GEN_LABELS[genMode.id]} сгенерирован. Нажми «Скачать», чтобы сохранить на устройство.`;
        setMessages((prev) => prev.map((m, i) => i === idx
          ? { role: 'ai', text: doneText, done: { mode: genMode.id, title: genMode.title, prompt } }
          : m));
        if (voiceOn) sayText(doneText);
      }
    }, 1000);
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    if (!user) { setSection('profile'); toast(tr('loginToChat')); return; }

    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);

    const local = localReply(text);
    if (local) { pushAI(local); return; }

    if (mode.gen) {
      setMessages((prev) => {
        const total = mode.id === 'video' ? 18 : mode.id === 'game' ? 15 : mode.id === 'music' ? 12 : 8;
        const next = [...prev, { role: 'ai' as const, text: '', generating: { mode: mode.id, total } }];
        const idx = next.length - 1;
        setTimeout(() => runGeneration(mode, idx, text), 0);
        return next;
      });
      return;
    }

    // обычный умный чат через ИИ
    setThinking(true);
    try {
      const history: ChatMessage[] = [...messages, { role: 'user', text }]
        .filter((m) => m.text)
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      const reply = await askAI(mode.id, history);
      pushAI({ role: 'ai', text: reply });
    } catch {
      pushAI({ role: 'ai', text: 'Упс, не получилось ответить. Попробуй ещё раз через пару секунд.' });
    } finally {
      setThinking(false);
    }
  };

  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); return; }
    const rec = createRecognition(lang);
    if (!rec) { toast.error(tr('micUnsupported')); return; }
    recRef.current = rec;
    rec.onresult = (e) => {
      const said = e.results[0][0].transcript;
      setInput(said);
      setListening(false);
      setTimeout(() => send(said), 100);
    };
    rec.onend = () => setListening(false);
    try { rec.start(); setListening(true); } catch { toast.error(tr('micDenied')); }
  };

  const submitAuth = async () => {
    setAuthBusy(true);
    try {
      const res = authMode === 'register'
        ? await register(authForm.name, authForm.email, authForm.password)
        : await login(authForm.email, authForm.password);
      if (res.status === 200) {
        localStorage.setItem('slowai_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setSection('chat');
        toast(`${res.data.user.name}, добро пожаловать!`);
      } else if (res.data.error === 'email_exists') toast.error(tr('errEmail'));
      else if (res.data.error === 'invalid_data') toast.error(tr('errFields'));
      else toast.error(tr('errCreds'));
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = () => {
    stopSpeak();
    localStorage.removeItem('slowai_token');
    setToken(null); setUser(null); setMessages([]);
  };

  const updateSetting = async (key: keyof User['settings'], value: string | number | boolean) => {
    if (!user || !token) return;
    const newSettings = { ...user.settings, [key]: value };
    setUser({ ...user, settings: newSettings });
    if (key === 'language') localStorage.setItem('slowai_lang', String(value));
    await saveSettings(token, newSettings);
    if (key !== 'speed') toast(tr('saved'));
  };

  return (
    <div className="min-h-screen mesh-bg flex text-foreground">
      <button onClick={() => setSection('chat')} className="fixed top-4 left-4 z-50 flex items-center gap-2 group">
        <img src={LOGO} alt="SlowAISkk" className="w-10 h-10 rounded-xl object-cover glow group-hover:scale-110 transition-transform" />
        <span className="font-sora font-extrabold text-lg gradient-text hidden sm:block">SlowAISkk</span>
      </button>

      <button onClick={() => setMenuOpen(true)} className="fixed top-4 right-4 z-50 w-11 h-11 rounded-xl bg-card/70 backdrop-blur border border-border flex items-center justify-center hover:bg-card transition">
        <Icon name="Menu" size={22} />
      </button>

      {/* Боковое меню */}
      <div className={`fixed inset-0 z-40 transition ${menuOpen ? 'visible' : 'invisible'}`}>
        <div onClick={() => setMenuOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} />
        <aside className={`absolute right-0 top-0 h-full w-[88%] max-w-sm bg-card border-l border-border p-5 overflow-y-auto scrollbar-thin transition-transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sora font-bold text-xl">{tr('modes')}</h3>
            <button onClick={() => setMenuOpen(false)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><Icon name="X" size={18} /></button>
          </div>

          <div className="space-y-2">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => { setMode(m); setSection('chat'); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition text-left ${mode.id === m.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                  <Icon name={m.icon} size={20} className="text-white" />
                </div>
                <div className="font-semibold">{m.title}</div>
              </button>
            ))}
          </div>

          <button onClick={() => { setMode(MODES[1]); setSection('chat'); setMenuOpen(false); }}
            className="mt-4 w-full p-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 flex items-center justify-between glow">
            <span className="flex items-center gap-2 font-sora font-bold text-white"><Icon name="Sparkles" size={18} /> {tr('openCreateGame')}</span>
            <Icon name="Maximize2" size={18} className="text-white" />
          </button>

          <div className="my-6 h-px bg-border" />

          <div className="space-y-1">
            <button onClick={() => { setSection('profile'); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition"><Icon name="User" size={18} /> {tr('profile')}</button>
            <button onClick={() => { setSection('settings'); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition"><Icon name="Settings" size={18} /> {tr('settings')}</button>
            {user && <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition text-destructive"><Icon name="LogOut" size={18} /> {tr('logout')}</button>}
          </div>
        </aside>
      </div>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-20 pb-44">
        {section === 'chat' && (
          messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
              <img src={LOGO} alt="" className="w-24 h-24 rounded-3xl object-cover glow animate-float mb-6" />
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{tr('greeting')} <span className="gradient-text">SlowAISkk</span></h1>
              <p className="text-muted-foreground max-w-md mb-8">{tr('subtitle')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl">
                {MODES.map((m) => (
                  <button key={m.id} onClick={() => setMode(m)}
                    className={`p-4 rounded-2xl border bg-card/50 backdrop-blur hover:scale-[1.03] transition text-left ${mode.id === m.id ? 'border-primary' : 'border-border'}`}>
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center mb-2`}><Icon name={m.icon} size={18} className="text-white" /></div>
                    <div className="font-semibold text-sm">{m.title}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'ai' && <img src={LOGO} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                    {msg.generating ? (
                      <div className="min-w-[220px]">
                        <div className="flex items-center gap-2 mb-2 font-medium"><Icon name="Loader" size={16} className="animate-spin text-accent" /> {tr('generating')} {GEN_LABELS[msg.generating.mode]}…</div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-1000" style={{ width: `${100 - (msg.generating.total / (msg.generating.mode === 'video' ? 18 : msg.generating.mode === 'game' ? 15 : msg.generating.mode === 'music' ? 12 : 8)) * 100}%` }} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1.5">{tr('timeLeft')}: ~{msg.generating.total} сек</div>
                      </div>
                    ) : msg.done ? (
                      <div>
                        <p className="mb-3">{msg.text}</p>
                        <Button size="sm" className="gap-2" onClick={() => { downloadGeneration(msg.done!.mode, msg.done!.prompt); toast('Файл сохраняется на устройство'); }}>
                          <Icon name="Download" size={16} /> {tr('download')}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.support && (
                          <div className="mt-3 space-y-2">
                            {SUPPORT.map((s) => (
                              <a key={s.id} href={s.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary hover:bg-muted transition">
                                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}><Icon name={s.icon} size={16} className="text-white" /></div>
                                <div className="text-sm"><div className="font-semibold">{s.label}</div><div className="text-xs text-muted-foreground">{s.value}</div></div>
                                <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        )}
                        {msg.role === 'ai' && msg.text && (
                          <button onClick={() => sayText(msg.text)}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition">
                            <Icon name="Volume2" size={14} /> {tr('listen')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3 animate-fade-in">
                  <img src={LOGO} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  <div className="p-3 rounded-2xl bg-card border border-border text-muted-foreground flex items-center gap-2">
                    <Icon name="Loader" size={16} className="animate-spin" /> {tr('thinking')}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )
        )}

        {section === 'profile' && (
          user ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-in">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center mb-4 text-3xl font-bold text-white">{user.name[0]?.toUpperCase()}</div>
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-muted-foreground mb-6">{user.email}</p>
              <Button variant="secondary" onClick={logout} className="gap-2"><Icon name="LogOut" size={16} /> {tr('logout')}</Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center animate-scale-in w-full">
              <img src={LOGO} alt="" className="w-16 h-16 rounded-2xl object-cover glow mb-4" />
              <h2 className="text-2xl font-bold mb-1">{authMode === 'register' ? tr('registerTitle') : tr('loginTitle')}</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">{tr('loginToChat')}</p>
              <div className="w-full max-w-xs space-y-3">
                {authMode === 'register' && (
                  <Input placeholder={tr('name')} value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
                )}
                <Input placeholder={tr('email')} type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                <Input placeholder={tr('password')} type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                <Button className="w-full glow" disabled={authBusy} onClick={submitAuth}>
                  {authBusy ? <Icon name="Loader" size={18} className="animate-spin" /> : (authMode === 'register' ? tr('register') : tr('login'))}
                </Button>
                <button onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')} className="w-full text-sm text-muted-foreground hover:text-foreground transition">
                  {authMode === 'register' ? tr('haveAccount') : tr('noAccount')}
                </button>
              </div>
            </div>
          )
        )}

        {section === 'settings' && (
          <div className="flex-1 animate-fade-in pt-4">
            <h2 className="text-2xl font-bold mb-6">{tr('settings')}</h2>
            {!user && <p className="text-muted-foreground mb-4">Войди в профиль, чтобы сохранять настройки.</p>}

            <div className="p-4 rounded-2xl bg-card border border-border mb-3">
              <div className="flex items-center gap-3 mb-3">
                <Icon name="Globe" size={20} className="text-accent" />
                <span className="font-medium">{tr('language')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button key={l.id} onClick={() => updateSetting('language', l.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${lang === l.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border mb-3">
              <Icon name="MessageCircle" size={20} className="text-accent" />
              <span className="font-medium">{tr('voiceReply')}</span>
              <Switch className="ml-auto" checked={user?.settings.voiceReply ?? false} onCheckedChange={(v) => updateSetting('voiceReply', v)} />
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border mb-3">
              <div className="flex items-center gap-3 mb-3">
                <Icon name="Mic" size={20} className="text-accent" />
                <span className="font-medium">{tr('voice')}</span>
              </div>
              <select
                value={user?.settings.voice ?? ''}
                onChange={(e) => updateSetting('voice', e.target.value)}
                className="w-full bg-secondary rounded-lg px-3 py-2 outline-none text-sm">
                <option value="">Авто (по языку)</option>
                {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
              </select>
              <div className="flex items-center gap-3 mt-4">
                <Icon name="Gauge" size={18} className="text-accent" />
                <span className="text-sm">{tr('speed')}</span>
                <input type="range" min={0.6} max={1.6} step={0.1}
                  value={user?.settings.speed ?? 1}
                  onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
                  className="ml-auto flex-1 max-w-[140px] accent-primary" />
                <span className="text-sm w-8 text-right">{(user?.settings.speed ?? 1).toFixed(1)}×</span>
              </div>
              <Button size="sm" variant="secondary" className="mt-3 gap-2" onClick={() => sayText('Привет! Это мой голос. Я SlowAISkk.')}>
                <Icon name="Play" size={14} /> Проверить голос
              </Button>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border mb-3">
              <Icon name="Bell" size={20} className="text-accent" />
              <span className="font-medium">{tr('notifications')}</span>
              <Switch className="ml-auto" checked={user?.settings.notifications ?? true} onCheckedChange={(v) => updateSetting('notifications', v)} />
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border mb-3">
              <Icon name="Volume2" size={20} className="text-accent" />
              <span className="font-medium">{tr('sound')}</span>
              <Switch className="ml-auto" checked={user?.settings.sound ?? true} onCheckedChange={(v) => updateSetting('sound', v)} />
            </div>
          </div>
        )}
      </main>

      {section === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary font-medium flex items-center gap-1"><Icon name={mode.icon} size={12} /> {mode.title}</span>
              <span>v0.10.0</span>
            </div>
            <div className="flex items-end gap-2 p-2 rounded-3xl bg-card border border-border shadow-2xl">
              <button onClick={toggleMic} title={tr('listening')}
                className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center transition ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-secondary hover:bg-muted'}`}>
                <Icon name="Mic" size={20} />
              </button>
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1} placeholder={listening ? tr('listening') : mode.placeholder}
                className="flex-1 bg-transparent resize-none outline-none px-3 py-2 max-h-32 scrollbar-thin" />
              <Button onClick={() => send()} size="icon" className="rounded-2xl shrink-0 glow" disabled={thinking}><Icon name="ArrowUp" size={20} /></Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">{tr('support')}:</span>
              {SUPPORT.map((s) => (
                <a key={s.id} href={s.href} target="_blank" rel="noreferrer" title={s.label}
                  className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center hover:scale-110 transition`}>
                  <Icon name={s.icon} size={15} className="text-white" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;