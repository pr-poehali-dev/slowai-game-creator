import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const LOGO = 'https://cdn.poehali.dev/projects/fe189c7a-586e-4b69-ab19-ed54c04dfaf1/files/efc278ff-1a15-485e-9e1e-6b653ccc1f01.jpg';

type Mode = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  placeholder: string;
};

const MODES: Mode[] = [
  { id: 'chat', title: 'Умный чат', desc: 'Ответы на вопросы, помощь с учёбой, решение задач', icon: 'MessageSquare', color: 'from-violet-500 to-purple-600', placeholder: 'Спроси что угодно: 2+2, реши задачу, объясни тему…' },
  { id: 'game', title: 'Create Game', desc: 'Создай 2D или 3D мини-игру по описанию', icon: 'Gamepad2', color: 'from-fuchsia-500 to-pink-600', placeholder: 'Опиши игру: платформер с прыжками и сменой погоды…' },
  { id: 'image', title: 'Генерация фото', desc: 'Создавай изображения по тексту', icon: 'Image', color: 'from-cyan-400 to-blue-500', placeholder: 'Опиши картинку: космонавт на неоновой планете…' },
  { id: 'video', title: 'Короткие видео', desc: 'Генерация коротких роликов', icon: 'Video', color: 'from-emerald-400 to-teal-500', placeholder: 'Опиши видео: пролёт камеры над футуристичным городом…' },
  { id: 'music', title: 'Музыка', desc: 'Сочиняй треки по настроению', icon: 'Music', color: 'from-amber-400 to-orange-500', placeholder: 'Опиши музыку: энергичный синтвейв для игры…' },
];

const SUPPORT = [
  { id: 'gmail', label: 'Почта (Gmail)', value: 'hypegoshop90@gmail.com', icon: 'Mail', color: 'bg-red-500', href: 'mailto:hypegoshop90@gmail.com' },
  { id: 'wa', label: 'WhatsApp', value: '+7 904 374 83 13', icon: 'MessageCircle', color: 'bg-green-500', href: 'https://wa.me/79043748313' },
  { id: 'tg', label: 'Telegram', value: '+7 904 374 83 13', icon: 'Send', color: 'bg-sky-500', href: 'https://t.me/+79043748313' },
];

type Msg = { role: 'user' | 'ai'; text: string; support?: boolean };

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [section, setSection] = useState<'chat' | 'profile' | 'settings'>('chat');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const aiReply = (text: string): Msg => {
    const t = text.toLowerCase();
    if (t.includes('поддерж') || t.includes('помощь связ') || t.includes('связаться')) {
      return { role: 'ai', text: 'Вот как со мной можно связаться — выбери удобный канал:', support: true };
    }
    const math = text.replace(/\s/g, '').match(/^(-?\d+(?:\.\d+)?)([+\-*/])(-?\d+(?:\.\d+)?)$/);
    if (math) {
      const a = parseFloat(math[1]); const op = math[2]; const b = parseFloat(math[3]);
      const r = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
      return { role: 'ai', text: `${text} = ${r}` };
    }
    if (t.includes('врем') || t.includes('сколько час')) {
      return { role: 'ai', text: `Сейчас ${new Date().toLocaleTimeString('ru-RU')}.` };
    }
    if (mode.id === 'game') {
      return { role: 'ai', text: 'Отлично! Готовлю твою игру в редакторе Create Game — открой режим Create Game в меню, чтобы собрать механики, добавить блоки и протестировать в 2D или 3D.' };
    }
    if (mode.id !== 'chat') {
      return { role: 'ai', text: `Принято! Генерирую «${mode.title}» по описанию. Когда будет готово — дам файл для скачивания и просмотра.` };
    }
    return { role: 'ai', text: 'Я SlowAISkk — могу ответить на вопрос, помочь с уроками, посчитать пример или создать игру, фото, видео и музыку. Расскажи, что нужно!' };
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Msg = { role: 'user', text: input.trim() };
    const reply = aiReply(input.trim());
    setMessages((m) => [...m, userMsg, reply]);
    setInput('');
  };

  return (
    <div className="min-h-screen mesh-bg flex text-foreground">
      {/* Логотип в левом углу */}
      <button
        onClick={() => setSection('chat')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 group"
      >
        <img src={LOGO} alt="SlowAISkk" className="w-10 h-10 rounded-xl object-cover glow group-hover:scale-110 transition-transform" />
        <span className="font-sora font-extrabold text-lg gradient-text hidden sm:block">SlowAISkk</span>
      </button>

      {/* Три полоски — меню режимов */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed top-4 right-4 z-50 w-11 h-11 rounded-xl bg-card/70 backdrop-blur border border-border flex items-center justify-center hover:bg-card transition"
      >
        <Icon name="Menu" size={22} />
      </button>

      {/* Боковое меню */}
      <div className={`fixed inset-0 z-40 transition ${menuOpen ? 'visible' : 'invisible'}`}>
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside className={`absolute right-0 top-0 h-full w-[88%] max-w-sm bg-card border-l border-border p-5 overflow-y-auto scrollbar-thin transition-transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sora font-bold text-xl">Режимы</h3>
            <button onClick={() => setMenuOpen(false)} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <Icon name="X" size={18} />
            </button>
          </div>

          <div className="space-y-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m); setSection('chat'); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition text-left ${mode.id === m.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary'}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                  <Icon name={m.icon} size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Create Game — особый блок */}
          <button
            onClick={() => { setMode(MODES[1]); setSection('chat'); setMenuOpen(false); }}
            className="mt-4 w-full p-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 flex items-center justify-between glow"
          >
            <span className="flex items-center gap-2 font-sora font-bold text-white">
              <Icon name="Sparkles" size={18} /> Открыть Create Game
            </span>
            <Icon name="Maximize2" size={18} className="text-white" />
          </button>

          <div className="my-6 h-px bg-border" />

          <div className="space-y-1">
            <button onClick={() => { setSection('profile'); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition">
              <Icon name="User" size={18} /> Профиль
            </button>
            <button onClick={() => { setSection('settings'); setMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition">
              <Icon name="Settings" size={18} /> Настройки
            </button>
          </div>
        </aside>
      </div>

      {/* Контент */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-20 pb-40">
        {section === 'chat' && (
          <>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
                <img src={LOGO} alt="" className="w-24 h-24 rounded-3xl object-cover glow animate-float mb-6" />
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">
                  Привет, я <span className="gradient-text">SlowAISkk</span>
                </h1>
                <p className="text-muted-foreground max-w-md mb-8">
                  Умный ИИ: отвечу на вопросы и помогу с учёбой, создам игру, фото, видео и музыку по описанию.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m)}
                      className={`p-4 rounded-2xl border bg-card/50 backdrop-blur hover:scale-[1.03] transition text-left ${mode.id === m.id ? 'border-primary' : 'border-border'}`}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center mb-2`}>
                        <Icon name={m.icon} size={18} className="text-white" />
                      </div>
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
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.support && (
                        <div className="mt-3 space-y-2">
                          {SUPPORT.map((s) => (
                            <a key={s.id} href={s.href} target="_blank" rel="noreferrer"
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary hover:bg-muted transition">
                              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                                <Icon name={s.icon} size={16} className="text-white" />
                              </div>
                              <div className="text-sm">
                                <div className="font-semibold">{s.label}</div>
                                <div className="text-xs text-muted-foreground">{s.value}</div>
                              </div>
                              <Icon name="ChevronRight" size={16} className="ml-auto text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            )}
          </>
        )}

        {section === 'profile' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center mb-4">
              <Icon name="User" size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Профиль</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">Войди, чтобы общаться с ИИ и сохранять прогресс — аккаунт будет доступен после выхода.</p>
            <div className="w-full max-w-xs space-y-3">
              <Button className="w-full bg-white text-black hover:bg-white/90 gap-2"><Icon name="Chrome" size={18} /> Войти через Google</Button>
              <Button className="w-full bg-red-500 hover:bg-red-600 gap-2"><Icon name="Globe" size={18} /> Войти через Яндекс</Button>
              <Button className="w-full bg-sky-500 hover:bg-sky-600 gap-2"><Icon name="Send" size={18} /> Войти через ВК</Button>
            </div>
          </div>
        )}

        {section === 'settings' && (
          <div className="flex-1 animate-fade-in pt-4">
            <h2 className="text-2xl font-bold mb-6">Настройки</h2>
            {[
              { icon: 'Globe', label: 'Язык', value: 'Русский' },
              { icon: 'Moon', label: 'Тема', value: 'Тёмная' },
              { icon: 'Bell', label: 'Уведомления', value: 'Включены' },
              { icon: 'Volume2', label: 'Звук генерации', value: 'Вкл' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border mb-3">
                <Icon name={s.icon} size={20} className="text-accent" />
                <span className="font-medium">{s.label}</span>
                <span className="ml-auto text-muted-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Нижняя строка ввода + поддержка */}
      {section === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary font-medium flex items-center gap-1">
                <Icon name={mode.icon} size={12} /> {mode.title}
              </span>
              <span>v0.10.0</span>
            </div>
            <div className="flex items-end gap-2 p-2 rounded-3xl bg-card border border-border shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder={mode.placeholder}
                className="flex-1 bg-transparent resize-none outline-none px-3 py-2 max-h-32 scrollbar-thin"
              />
              <Button onClick={send} size="icon" className="rounded-2xl shrink-0 glow">
                <Icon name="ArrowUp" size={20} />
              </Button>
            </div>
            {/* Поддержка снизу */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Поддержка:</span>
              {SUPPORT.map((s) => (
                <a key={s.id} href={s.href} target="_blank" rel="noreferrer"
                  title={s.label}
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
