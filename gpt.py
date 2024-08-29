from flask import Flask, request, jsonify, render_template, Response, stream_with_context
import requests
import json
import re
from markdown.extensions import fenced_code
import markdown
import pyodbc

app = Flask(__name__)

# 数据库连接设置
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER= Russel;'
    'DATABASE=ChatGPT;'
    'USER = sa;'
    'PASSWORD = a135791111;'
    'Trusted_Connection=yes;'
)
cursor = conn.cursor()
cursor.execute("SELECT 1")
print(cursor.fetchone())

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    query = "SELECT * FROM Users WHERE username = ? AND password = ?"
    cursor.execute(query, (username, password))
    result = cursor.fetchone()
    if result:
        return jsonify({'success': True, 'username': username})
    else:
        return jsonify({'success': False, 'message': '账号或密码错误'})

@app.route('/register')
def register_success():
    return render_template('register.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    cursor.execute("SELECT Username FROM Users WHERE Username = ?", (username,))
    result = cursor.fetchone()
    if result:
        return jsonify({"success": False, "message": "用户已经存在"})
    else:
        insert_query = "INSERT INTO Users (Username, Password) VALUES(?, ?)"
        cursor.execute(insert_query, (username, password))
        conn.commit()
        return jsonify({"success": True, "message": "注册成功"})

@app.route('/chat.html')
def chat():
    return render_template('chat.html')

@app.route('/api/chat', methods=['POST'])
def chat_api():
    api_key = 'your-private-key'  
    endpoint = 'your-endpoint'
    
    data = request.get_json()
    username = data.get('username')
    message = data.get('message')
    
    save_message(username, 'User', message)

    recent_messages = get_recent_messages(username)
    
    messages = ' '.join([f"{msg['sender']}: {msg['content']}" for msg in recent_messages]) + message

    def generate():
        try:
            response = requests.post(
                endpoint,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}'
                },
                json={
                    'model': 'gpt-4o-mini',
                    'messages': [
                        {'role': 'system', 'content': 'Please format your responses with proper line breaks and paragraphs.'},
                        {'role': 'user', 'content': messages}
                    ],
                    'stream': True
                },
                stream=True
            )
            full_response = ''
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        json_data = line[6:].strip()
                        if json_data:
                            try:
                                data = json.loads(json_data)
                                if 'choices' in data:
                                    content = data['choices'][0].get('delta', {}).get('content', '')
                                    if content:
                                        full_response += content
                                        yield content
                            except json.JSONDecodeError:
                                pass
            save_message(username, 'AI', full_response)
            conn.commit()
        except Exception as e:
            pass

    return Response(stream_with_context(generate()), content_type='text/event-stream')

def get_recent_messages(username):
    cursor.execute("""
        SELECT TOP 4 SenderType, MessageContent, SentAt 
        FROM ChatMessages 
        WHERE Username = ? 
        ORDER BY SentAt DESC
    """, (username,))
    messages = [{'sender': row[0], 'content': row[1], 'sent_at': row[2]} for row in cursor.fetchall()]
    return messages[::-1]

def normalize_api_text(text):
    paragraphs = text.split('###')
    result = []
    
    for para in paragraphs:
        para = para.strip()
        if para:
            match = re.match(r'(\d+\.\s*\*\*[^*]+\*\*)\s*(.*)', para, re.DOTALL)
            if match:
                title, content = match.groups()
                result.append({'title': title.strip(), 'content': content.strip()})
    
    return result

@app.route('/api/normalize', methods=['POST'])
def normalize():
    text = request.json['text']
    normalized_data = normalize_api_text(text)
    return jsonify(normalized_data)

@app.route('/api/convert', methods=['POST'])
def convert():
    md_text = request.json['text']
    html = markdown.markdown(md_text, extensions=['fenced_code'])
    return jsonify({'html': html})

def save_message(username, sender_type, message_content):
    insert_query = "INSERT INTO ChatMessages (Username, SenderType, MessageContent) VALUES (?, ?, ?)"
    cursor.execute(insert_query, (username, sender_type, message_content))
    conn.commit()

@app.route('/api/get_messages', methods=['GET'])
def get_messages():
    username = request.args.get('username')
    cursor.execute("""
        SELECT SenderType, MessageContent, SentAt 
        FROM ChatMessages 
        WHERE Username = ? 
        ORDER BY SentAt
    """, (username,))
    messages = [{'sender': row[0], 'content': row[1], 'sent_at': row[2]} for row in cursor.fetchall()]
    return jsonify(messages)

@app.route('/api/clean_messages', methods=['POST'])
def clean_messages():
    data = request.get_json()
    username = data.get('username')
    query = 'DELETE FROM ChatMessages WHERE Username = ?'
    cursor.execute(query, (username,))
    conn.commit()
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
