from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
import os
from datetime import datetime
import random
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
from psycopg2.extras import RealDictCursor
import json

app = Flask(__name__)
app.secret_key = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

DATABASE_URL = 'postgresql://postgres:1234567890@localhost:5432/TankBattleWeb'

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

class User(UserMixin):
    def __init__(self, id, username, email, is_admin=False):
        self.id = id
        self.username = username
        self.email = email
        self.is_admin = is_admin

@login_manager.user_loader
def load_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM users WHERE id = %s', (user_id,))
    user_data = cur.fetchone()
    cur.close()
    conn.close()
    if user_data:
        return User(user_data['id'], user_data['username'], user_data['email'], user_data['is_admin'])
    return None

@app.route('/')
def index():
    if current_user.is_authenticated:
        # Redirect admins to admin dashboard, regular users to lobby
        return redirect(url_for('admin') if current_user.is_admin else url_for('lobby'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('lobby'))
    
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM users WHERE username = %s', (username,))
        user_data = cur.fetchone()
        cur.close()
        conn.close()
        
        if user_data and check_password_hash(user_data['password_hash'], password):
            user = User(user_data['id'], user_data['username'], user_data['email'], user_data['is_admin'])
            login_user(user)
            # Redirect admins to admin dashboard, regular users to lobby
            redirect_url = url_for('admin') if user.is_admin else url_for('lobby')
            return jsonify({'success': True, 'redirect': redirect_url})
        
        return jsonify({'success': False, 'message': 'Invalid username or password'})
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('lobby'))
    
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute('SELECT * FROM users WHERE username = %s OR email = %s', (username, email))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Username or email already exists'})
        
        password_hash = generate_password_hash(password)
        cur.execute(
            'INSERT INTO users (username, email, password_hash, created_at) VALUES (%s, %s, %s, %s) RETURNING id',
            (username, email, password_hash, datetime.now())
        )
        user_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'redirect': url_for('login')})
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/lobby')
@login_required
def lobby():
    # Redirect admins to their admin dashboard
    if current_user.is_admin:
        return redirect(url_for('admin'))
    return render_template('lobby.html', username=current_user.username)

@app.route('/instructions')
@login_required
def instructions():
    return render_template('instructions.html', username=current_user.username)

@app.route('/account')
@login_required
def account():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute('''
        SELECT COUNT(*) as total_games, 
               SUM(CASE WHEN winner_id = %s THEN 1 ELSE 0 END) as wins,
               SUM(CASE WHEN winner_id != %s AND winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses
        FROM game_history 
        WHERE player1_id = %s OR player2_id = %s
    ''', (current_user.id, current_user.id, current_user.id, current_user.id))
    stats = cur.fetchone()
    
    cur.execute('''
        SELECT * FROM game_history 
        WHERE player1_id = %s OR player2_id = %s
        ORDER BY played_at DESC LIMIT 10
    ''', (current_user.id, current_user.id))
    recent_games = cur.fetchall()
    
    # Add result field to each game based on game_mode and winner_id
    for game in recent_games:
        if game['game_mode'].startswith('ai-'):
            # AI games: show Victory or Defeat
            if game['winner_id'] == current_user.id:
                game['result'] = 'Victory'
            else:
                game['result'] = 'Defeat'
        else:
            # 2-player local games: show Local (neutral, no win/loss tracking)
            game['result'] = 'Local'
    
    cur.close()
    conn.close()
    
    return render_template('account.html', 
                         username=current_user.username, 
                         email=current_user.email,
                         stats=stats,
                         recent_games=recent_games)

@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        return redirect(url_for('lobby'))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT id, username, email, created_at, is_admin FROM users ORDER BY created_at DESC')
    users = cur.fetchall()
    cur.close()
    conn.close()
    
    return render_template('admin.html', users=users)

def admin_panel():
    if not current_user.is_admin:
        return redirect(url_for('lobby'))  # Or flash an error
    users = User.query.all()  # Fetch users from DB
    return render_template('admin.html', users=users)

@app.route('/admin/delete_user/<int:user_id>', methods=['POST'])
@login_required
def admin_delete_user(user_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    if user_id == current_user.id:
        return jsonify({'success': False, 'message': 'Cannot delete yourself'})
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM users WHERE id = %s', (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/admin/clear_history', methods=['POST'])
@login_required
def admin_clear_history():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM game_history')
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/admin/clear_user_history/<int:user_id>', methods=['POST'])
@login_required
def admin_clear_user_history(user_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM game_history WHERE player1_id = %s OR player2_id = %s', (user_id, user_id))
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/admin/user_stats/<int:user_id>')
@login_required
def admin_user_stats(user_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get user info
    cur.execute('SELECT username, email FROM users WHERE id = %s', (user_id,))
    user = cur.fetchone()
    
    if not user:
        cur.close()
        conn.close()
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    # Get stats
    cur.execute('''
        SELECT COUNT(*) as total_games, 
               SUM(CASE WHEN winner_id = %s THEN 1 ELSE 0 END) as wins,
               SUM(CASE WHEN winner_id != %s AND winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses
        FROM game_history 
        WHERE player1_id = %s OR player2_id = %s
    ''', (user_id, user_id, user_id, user_id))
    stats = cur.fetchone()
    
    # Get recent games
    cur.execute('''
        SELECT game_mode, winner_id, played_at FROM game_history 
        WHERE player1_id = %s OR player2_id = %s
        ORDER BY played_at DESC LIMIT 5
    ''', (user_id, user_id))
    recent_games = cur.fetchall()
    
    cur.close()
    conn.close()
    
    # Format recent games
    formatted_games = []
    for game in recent_games:
        if game['game_mode'].startswith('ai-'):
            result = 'Victory' if game['winner_id'] == user_id else 'Defeat'
        else:
            result = 'Local'
        formatted_games.append({
            'mode': game['game_mode'],
            'result': result,
            'date': game['played_at'].strftime('%Y-%m-%d')
        })
    
    return jsonify({
        'success': True,
        'user': user,
        'stats': stats,
        'recent_games': formatted_games
    })

@app.route('/game/<mode>')
@login_required
def game(mode):
    if mode not in ['2player', 'ai-normal', 'ai-hard', 'ai-nightmare']:
        return redirect(url_for('lobby'))
    return render_template('game.html', mode=mode, username=current_user.username)

@app.route('/api/save_game', methods=['POST'])
@login_required
def save_game():
    data = request.get_json()
    game_mode = data.get('game_mode')
    winner = data.get('winner')  # 1 = player 1 won, 2 = player 2/AI won
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Determine winner_id based on game mode:
    # - AI games: set winner_id to current_user.id if player won (winner === 1), else None
    # - 2-player local: don't track winner_id (always None)
    winner_id = None
    if game_mode.startswith('ai-') and winner == 1:
        # Player (human) won against AI
        winner_id = current_user.id
    
    cur.execute('''
        INSERT INTO game_history 
        (player1_id, player1_nation, player2_id, player2_nation, winner_id, game_mode, played_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    ''', (
        current_user.id,
        data.get('player1_nation'),
        data.get('player2_id'),
        data.get('player2_nation'),
        winner_id,
        game_mode,
        datetime.now()
    ))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
