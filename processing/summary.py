import json
import os

from openai import OpenAI

from database import getSummary, setSummary

api_key = os.getenv('OPENAI_KEY')
systemprompt = "You are the best waiter in the world you try to remember everything relevant to every costumer."


def parse_json(text: str):
    data = json.loads(text)
    username = data["username"]
    text = ""
    for message in data['messages']:
        text += (message['content'] + "  ")

    return text, username


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


def extract_from_conv_prompt(text: str, summary: str):
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system",
             "content": "You are the best waiter in the world you try to remember everything relevant costumer."},
            {"role": "user", "content": f"""Given that the conversation leader is identified, write summary about this person based on their role in the dialogue and what we already know (known summary).
                                        If the known summary is "NONE" ignore it
                                        Focus their dietary preferences, any restrictions they might have, and the types of food they typically enjoy or order and on anything eating-related.
                                        The summary should be concise and schematic, with crucial information about the order.
                                        Here is the known summary:
                                        {summary}

                                        Here is the dialogue:
                                        {text}"""}
        ]
    )
    return response.choices[0].message.content


def understand_conv_leader(conversation, known_info):
    resp = separation_prompt(conversation)
    nuovo_sum = extract_from_conv_prompt(resp, known_info)
    return nuovo_sum

def generate_summary(input_json: str):
    inputa, username = parse_json(input_json)
    old_summary = getSummary(username)
    new_summary = extract_from_conv_prompt(inputa, old_summary)
    setSummary(username, new_summary)
