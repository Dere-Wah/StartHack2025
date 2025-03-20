import sqlite3
import time

import sqlite3
import time

def initialize_database():
    with sqlite3.connect('summaries.db') as conn:
        # Create orders table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                username TEXT,
                order_id INTEGER,
                date INTEGER,
                summary TEXT,
                PRIMARY KEY (username, order_id)
            )
        ''')

        # Create new user_recap table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_recap (
                username TEXT PRIMARY KEY,
                recap TEXT
            )
        ''')

        # Initial orders data
        data = [
            ("Marco",
             "Marco is a fan of traditional Neapolitan pizza..."),
            # ... (other initial data entries same as before)
        ]

        current_time = int(time.time())
        data_orders = [
            (username, 1, current_time, summary) for (username, summary) in data
        ]

        conn.executemany('''
            INSERT OR IGNORE INTO orders (username, order_id, date, summary)
            VALUES (?, ?, ?, ?)
        ''', data_orders)

def getRecap(username):
    """Retrieve recap for a given username."""
    with sqlite3.connect('summaries.db') as conn:
        cursor = conn.execute(
            'SELECT recap FROM user_recap WHERE username = ?',
            (username,)
        )
        result = cursor.fetchone()
        return result[0] if result else None

def setRecap(username, recap):
    """Insert or update a recap for a given username."""
    with sqlite3.connect('summaries.db') as conn:
        conn.execute(
            'INSERT OR REPLACE INTO user_recap (username, recap) VALUES (?, ?)',
            (username, recap)
        )

def getSummary(username, order_id):
    """Retrieve summary for a given username and order_id."""
    with sqlite3.connect('summaries.db') as conn:
        cursor = conn.execute(
            'SELECT summary FROM orders WHERE username = ? AND order_id = ?',
            (username, order_id)
        )
        result = cursor.fetchone()
        return result[0] if result else None

def setSummary(username, order_id, summary):
    """Insert or update a summary for a given username and order_id with current timestamp."""
    current_time = int(time.time())
    with sqlite3.connect('summaries.db') as conn:
        conn.execute(
            'INSERT OR REPLACE INTO orders (username, order_id, date, summary) VALUES (?, ?, ?, ?)',
            (username, order_id, current_time, summary)
        )

def get_latest_summaries(username, n):
    """Retrieve the latest n summaries for a user as a formatted string."""
    with sqlite3.connect('summaries.db') as conn:
        cursor = conn.execute(
            'SELECT date, summary FROM orders WHERE username = ? ORDER BY date DESC LIMIT ?',
            (username, n))
        rows = cursor.fetchall()

        if not rows:
            return "No summaries found"

        result = []
        for date, summary in rows:
            # Convert epoch timestamp to readable format
            formatted_date = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(date))
            result.append(f"[{formatted_date}]\n{summary}")

        return '\n\n'.join(result)