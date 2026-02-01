import psycopg2
import os
from werkzeug.security import generate_password_hash

DATABASE_URL = 'postgresql://postgres:1234567890@localhost:5432/TankBattleWeb'

def init_database():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    cur.execute('DROP TABLE IF EXISTS game_history CASCADE')
    cur.execute('DROP TABLE IF EXISTS users CASCADE')
    
    cur.execute('''
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL
        )
    ''')
    
    cur.execute('''
        CREATE TABLE game_history (
            id SERIAL PRIMARY KEY,
            player1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            player1_nation VARCHAR(20),
            player2_id INTEGER,
            player2_nation VARCHAR(20),
            winner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            game_mode VARCHAR(20),
            played_at TIMESTAMP NOT NULL
        )
    ''')
    
    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized successfully!")
    print("\nIMPORTANT: No admin account created by default for security.")
    print("Please register a regular account, then promote it to admin using the promote_admin.py script.")

if __name__ == '__main__':
    init_database()
