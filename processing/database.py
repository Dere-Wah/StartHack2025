import sqlite3


def initialize_database():
    with sqlite3.connect('summaries.db') as conn:
        conn.execute('''
			CREATE TABLE IF NOT EXISTS users (
				username TEXT PRIMARY KEY,
				summary TEXT
			)
		''')

        data = [
            ("Marco",
             "Marco enjoys classic Italian dishes and often orders spaghetti carbonara with extra crispy guanciale or lasagna al forno. He prefers his pasta al dente and avoids seafood due to a shellfish allergy. His go-to appetizer is a bruschetta with tomatoes and basil, and he always orders a glass of Chianti red wine. For dessert, he sometimes tries new options but usually sticks to tiramisu with a double espresso."),
            ("Laura",
             "Laura follows a vegetarian diet and prefers whole grain pasta over regular pasta. She frequently orders zucchini and ricotta ravioli, chickpea soup, or a grilled vegetable platter with hummus. She is allergic to peanuts and always asks if a dish contains traces of them. She enjoys freshly squeezed orange juice and mint tea instead of coffee. For dessert, she usually picks a fruit salad or a vegan chocolate mousse."),
            ("Davide",
             "Davide enjoys grilled meats and often orders a medium-rare ribeye steak with a side of arugula and parmesan salad. He is lactose intolerant, so he avoids cheese-heavy dishes and creamy sauces. Occasionally, he orders grilled sea bass with lemon and rosemary, but he never eats raw seafood. His preferred starter is a platter of cured meats with sourdough bread. Instead of sugary drinks, he opts for sparkling water or a craft beer."),
            ("Giulia",
             "Giulia follows a high-protein diet and often orders a grilled chicken breast with quinoa and steamed broccoli. She avoids fried foods and refined sugars, preferring Greek yogurt with honey and almonds for dessert. She likes customizing her meals and frequently requests extra lean protein and a side of avocado. She drinks green tea or a protein smoothie instead of soft drinks.")
        ]

        # Insert data without updating existing records
        conn.executemany('''
			INSERT OR IGNORE INTO users (username, summary) VALUES (?, ?)
		''', data)


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
