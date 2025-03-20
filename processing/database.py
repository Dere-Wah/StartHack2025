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
             "Marco is a fan of traditional Neapolitan pizza and always orders a classic Margherita with fresh buffalo mozzarella and basil. Occasionally, he enjoys a Quattro Formaggi pizza but avoids seafood toppings due to a shellfish allergy. He pairs his pizza with a glass of Chianti red wine and finishes his meal with a slice of tiramisu and a double espresso."),
            ("Laura",
             "Laura prefers vegetarian pizzas with whole wheat crust. Her go-to choices are a Verdure Grigliate pizza loaded with zucchini, eggplant, and bell peppers, or a Funghi e Tartufo pizza with wild mushrooms and truffle oil. She is allergic to peanuts and always ensures her food is free from cross-contamination. Her favorite drink is a freshly squeezed orange juice or an herbal mint tea. For dessert, she enjoys a fruit sorbet or a vegan chocolate mousse."),
            ("Davide",
             "Davide enjoys meat-heavy pizzas and often orders a Diavola with spicy salami or a Boscaiola topped with sausage and mushrooms. Due to lactose intolerance, he opts for pizzas with lactose-free cheese or tomato-based options without dairy. He occasionally tries seafood pizzas but avoids raw toppings. His preferred drink is a craft beer or sparkling water. For dessert, he keeps it simple with an espresso or a small serving of dark chocolate."),
            ("Giulia",
             "Giulia follows a high-protein diet and often orders a Pollo e Avocado pizza with grilled chicken, avocado, and arugula on a thin crust. She avoids deep-dish and cheese-heavy pizzas, preferring light, nutritious toppings. Instead of soda, she drinks green tea or a protein smoothie. For dessert, she chooses Greek yogurt with honey and almonds or a protein-rich panna cotta."),
            ("Bob",
            "NONE")
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
