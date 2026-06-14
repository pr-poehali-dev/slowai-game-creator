import json
import os
import hashlib
import secrets
import psycopg2


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
        'body': json.dumps(body),
    }


def _hash(password: str) -> str:
    return hashlib.sha256(('slowaiskk_' + password).encode()).hexdigest()


def handler(event: dict, context) -> dict:
    '''Регистрация, вход и проверка сессии пользователей SlowAISkk.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return _resp(200, {})

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        if method == 'GET':
            token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
            if not token:
                return _resp(401, {'error': 'no_token'})
            cur.execute(
                "SELECT u.id, u.name, u.email, u.provider, u.settings FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s",
                (token,),
            )
            row = cur.fetchone()
            if not row:
                return _resp(401, {'error': 'invalid_token'})
            return _resp(200, {'user': {'id': row[0], 'name': row[1], 'email': row[2], 'provider': row[3], 'settings': row[4]}})

        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'login')

        if action == 'register':
            name = (body.get('name') or '').strip()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not name or not email or len(password) < 4:
                return _resp(400, {'error': 'invalid_data'})
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return _resp(409, {'error': 'email_exists'})
            cur.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id, settings",
                (name, email, _hash(password)),
            )
            uid, settings = cur.fetchone()
            token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (token, uid))
            return _resp(200, {'token': token, 'user': {'id': uid, 'name': name, 'email': email, 'provider': 'email', 'settings': settings}})

        if action == 'login':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            cur.execute("SELECT id, name, email, provider, settings, password_hash FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row or row[5] != _hash(password):
                return _resp(401, {'error': 'wrong_credentials'})
            token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (token, row[0]))
            return _resp(200, {'token': token, 'user': {'id': row[0], 'name': row[1], 'email': row[2], 'provider': row[3], 'settings': row[4]}})

        if action == 'settings':
            token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
            cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
            srow = cur.fetchone()
            if not srow:
                return _resp(401, {'error': 'invalid_token'})
            new_settings = body.get('settings') or {}
            cur.execute("UPDATE users SET settings = %s WHERE id = %s RETURNING settings", (json.dumps(new_settings), srow[0]))
            return _resp(200, {'settings': cur.fetchone()[0]})

        return _resp(400, {'error': 'unknown_action'})
    finally:
        cur.close()
        conn.close()
