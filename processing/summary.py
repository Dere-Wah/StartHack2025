import json
import os

from openai import OpenAI

from database import getSummary, setSummary, get_latest_summaries, setRecap

api_key = os.getenv('OPENAI_KEY')
systemprompt = "You are the best waiter in the world you try to remember everything relevant to every costumer."


def parse_json(text: str):
    data = json.loads(text)
    text = ""
    for message in data['messages']:
        text += (message['content'] + "  ")

    return text


def separation_prompt(text: str) -> str:
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": f"{systemprompt}"},
            {"role": "user", "content": f"""Given the following dialogue, identify the speaker for each line based on contextual clues.
                    The dialogue may contain named speakers, but some lines may be missing attributions.
                    Assign speakers logically by considering continuity, responses, and conversational flow.
                    Remember to identify the "Conversation Leader", the person who is interacting most.

                    Example Input:
                    Yes, I'll have sparkling water, please.
                    I'll have a lemonade instead.
                    I already have an idea… how is the mushroom risotto?
                    Then I'll take it!
                    I'll go with a classic: a rare steak with roasted potatoes on the side.
                    Yes, please!

                    Expected Output:
                    Marco: "Yes, I'll have sparkling water, please."
                    Giulia: "I'll have a lemonade instead."
                    Giulia: "I already have an idea… how is the mushroom risotto?"
                    Giulia: "Then I'll take it!"
                    Marco: "I'll go with a classic: a rare steak with roasted potatoes on the side."
                    Giulia: "Yes, please!"

                    Conversation Leader: "Marco"

                    Ensure that attributions remain consistent and logical throughout the conversation.

                    Here is the input:{text}
                    """}
        ]
    )
    return response.choices[0].message.content


def extract_from_conv_prompt(text: str):
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system",
             "content": "You are a waiter, and have just finished taking an order for an user. "
                        "You must now write a summary about this person's order based on their role in the dialogue. "
                        "Focus their dietary preferences, any restrictions they might have, and the types of food they "
                        "typically enjoy or order and on anything eating-related. "
                        "The summary should be concise and schematic, with crucial information about the order."
                        "Make the summary of this order and what was asked., and maybe details about the user. "
                        "Keep relevant details that might necessary for fidelizing the user, but ignore "
                        "non relevant information. You just need to reply with the recap, no assistant message."},
            {"role": "user", "content": f"""
                                        Here is the dialogue:
                                        {text}"""}
        ]
    )
    return response.choices[0].message.content


def extract_recap_from_orders(text: str):
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system",
             "content": "You are a waiter, keeping track of customers. You will need to generate a recap of a user's"
                        "habits based on their last 10 orders, each with a timestamp. So maybe store information about"
                        "diets, preferences, what his usual is, and maybe small informations to make small talk with"
                        "the customer. The recap should short and schematic, just holding the crucial information."
                        "Should not resemble natural speech, but more of a schema of the user's preferences and tastes."
                        "You just need to reply with the recap, no assistant message."},
            {"role": "user", "content": f"""
                                        Here is the recap of the last 10 orders:
                                        {text}"""}
        ]
    )
    return response.choices[0].message.content


def understand_conv_leader(conversation, known_info):
    resp = separation_prompt(conversation)
    nuovo_sum = extract_from_conv_prompt(resp, known_info)
    return nuovo_sum

def generate_summary(username, order_id, conversation):
    convo = parse_json(conversation)
    summary = extract_from_conv_prompt(convo)
    setSummary(username, order_id, summary)
    user_recap = extract_recap_from_orders(get_latest_summaries(username, 10))
    setRecap(username, user_recap)
