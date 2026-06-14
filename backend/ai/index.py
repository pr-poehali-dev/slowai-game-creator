import json
import os
import uuid
import urllib.request
import urllib.parse
import ssl


def _resp(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        },
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False),
    }


_ctx = ssl.create_default_context()
_ctx.check_hostname = False
_ctx.verify_mode = ssl.CERT_NONE


def _get_token():
    auth_key = os.environ['GIGACHAT_AUTH_KEY']
    data = urllib.parse.urlencode({'scope': 'GIGACHAT_API_PERS'}).encode()
    req = urllib.request.Request(
        'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
        data=data,
        method='POST',
        headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': str(uuid.uuid4()),
            'Authorization': f'Basic {auth_key}',
        },
    )
    with urllib.request.urlopen(req, context=_ctx, timeout=20) as r:
        return json.loads(r.read())['access_token']


SYSTEM_PROMPT = (
    'Ты — SlowAISkk, дружелюбный и очень умный ИИ-ассистент. '
    'Ты помогаешь с учёбой, решаешь задачи, отвечаешь на вопросы по-русски, '
    'умеешь объяснять темы и помогать создавать игры. Отвечай понятно и по делу. '
    'Никогда не упоминай, какая модель или компания тебя создала — ты просто SlowAISkk.'
)


def _chat(access_token, messages):
    payload = json.dumps({
        'model': 'GigaChat',
        'messages': [{'role': 'system', 'content': SYSTEM_PROMPT}] + messages,
        'temperature': 0.7,
        'max_tokens': 1200,
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
        data=payload,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {access_token}',
        },
    )
    with urllib.request.urlopen(req, context=_ctx, timeout=40) as r:
        result = json.loads(r.read())
    return result['choices'][0]['message']['content']


def handler(event: dict, context) -> dict:
    '''Чат и генерация контента SlowAISkk: отвечает на сообщения и создаёт описания игр, фото, видео и музыки.'''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return _resp(200, {})
    if method != 'POST':
        return _resp(405, {'error': 'method_not_allowed'})

    body = json.loads(event.get('body') or '{}')
    mode = body.get('mode', 'chat')
    history = body.get('messages', [])
    if not isinstance(history, list) or not history:
        return _resp(400, {'error': 'no_messages'})

    history = history[-12:]

    prompts = {
        'image': 'Пользователь хочет сгенерировать изображение. Опиши, что будет на готовой картинке, детально и красиво.',
        'video': 'Пользователь хочет сгенерировать короткое видео. Опиши сцены и кадры готового ролика.',
        'music': 'Пользователь хочет сгенерировать музыку. Опиши настроение, инструменты и структуру готового трека.',
        'game': 'Пользователь хочет создать мини-игру. Опиши механику, управление и как в неё играть.',
    }
    if mode in prompts:
        history = [{'role': 'system', 'content': prompts[mode]}] + history

    try:
        token = _get_token()
        answer = _chat(token, history)
    except Exception as e:
        return _resp(502, {'error': 'ai_unavailable', 'detail': str(e)[:200]})

    return _resp(200, {'reply': answer, 'mode': mode})
