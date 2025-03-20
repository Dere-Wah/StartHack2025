import sqlite3



def getSummary(username):
    """Retrieve summary for a given username."""
    with sqlite3.connect('summaries.db') as conn:
        cursor = conn.execute(
            'SELECT summary FROM users WHERE username = ?',
            (username,)
        )
        result = cursor.fetchone()
        return result[0] if result else None

def setSummary(username, summary):
    """Insert or update a summary for a given username."""
    with sqlite3.connect('summaries.db') as conn:
        conn.execute(
            'INSERT OR REPLACE INTO users (username, summary) VALUES (?, ?)',
            (username, summary)
        )

