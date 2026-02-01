import psycopg2
import os
import sys

DATABASE_URL = 'postgresql://postgres:1234567890@localhost:5432/TankBattleWeb'

def promote_user_to_admin(username):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    cur.execute('SELECT id, username, is_admin FROM users WHERE username = %s', (username,))
    user = cur.fetchone()
    
    if not user:
        print(f"Error: User '{username}' not found.")
        cur.close()
        conn.close()
        return False
    
    if user[2]:
        print(f"User '{username}' is already an admin.")
        cur.close()
        conn.close()
        return True
    
    cur.execute('UPDATE users SET is_admin = TRUE WHERE username = %s', (username,))
    conn.commit()
    
    cur.close()
    conn.close()
    print(f"Success: User '{username}' has been promoted to admin.")
    return True

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python promote_admin.py <username>")
        print("\nExample: python promote_admin.py myusername")
        sys.exit(1)
    
    username = sys.argv[1]
    promote_user_to_admin(username)
