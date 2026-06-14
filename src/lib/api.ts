const AUTH_URL = 'https://functions.poehali.dev/7806a32f-aa71-4e8c-99cd-c36fc427c823';
const AI_URL = 'https://functions.poehali.dev/56e2b223-de4f-4e1a-8834-4da0784052f2';

export type User = {
  id: number;
  name: string;
  email: string;
  provider: string;
  settings: { language: string; theme: string; notifications: boolean; sound: boolean };
};

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function register(name: string, email: string, password: string) {
  const r = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', name, email, password }),
  });
  return { status: r.status, data: await r.json() };
}

export async function login(email: string, password: string) {
  const r = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });
  return { status: r.status, data: await r.json() };
}

export async function getMe(token: string) {
  const r = await fetch(AUTH_URL, { method: 'GET', headers: { 'X-Auth-Token': token } });
  return { status: r.status, data: await r.json() };
}

export async function saveSettings(token: string, settings: User['settings']) {
  const r = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
    body: JSON.stringify({ action: 'settings', settings }),
  });
  return { status: r.status, data: await r.json() };
}

export async function askAI(mode: string, messages: ChatMessage[]): Promise<string> {
  const r = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, messages }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'ai_error');
  return data.reply as string;
}
