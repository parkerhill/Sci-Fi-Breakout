from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import sqlite3
import os

app = Flask(__name__, static_folder='.')
DATABASE = 'highscores.db'

# Initialize database
with sqlite3.connect(DATABASE) as conn:
    conn.execute('''
        CREATE TABLE IF NOT EXISTS highscores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            initials TEXT NOT NULL,
            score INTEGER NOT NULL,
            date TEXT NOT NULL
        )
    ''')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

@app.route('/highscores', methods=['GET'])
def get_highscores():
    with sqlite3.connect(DATABASE) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT initials, score FROM highscores ORDER BY score DESC LIMIT 5')
        scores = cursor.fetchall()
        return jsonify([dict(score) for score in scores])

@app.route('/highscores', methods=['POST'])
def add_highscore():
    data = request.get_json()
    if not data or 'initials' not in data or 'score' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    initials = data['initials'][:3].upper()
    score = int(data['score'])

    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO highscores (initials, score, date) VALUES (?, ?, ?)',
                      (initials, score, datetime.now().isoformat()))
        
        # Keep only top 5 scores
        cursor.execute('SELECT id FROM highscores ORDER BY score DESC LIMIT 5')
        top_ids = [row[0] for row in cursor.fetchall()]
        if top_ids:
            cursor.execute('DELETE FROM highscores WHERE id NOT IN ({})'.format(
                ','.join('?' for _ in top_ids)), top_ids)

    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
