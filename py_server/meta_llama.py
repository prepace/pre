import os
from dotenv import load_dotenv
import torch
from transformers import pipeline
from huggingface_hub import login

# Load .env and Hugging Face token
load_dotenv()
hf_token = os.getenv("HF_TOKEN")

if not hf_token:
    raise ValueError("HF_TOKEN not found in .env")

# Authenticate with Hugging Face
login(token=hf_token)

# Load LLaMA 3.2B Instruct
model_id = "meta-llama/Llama-3.2-3B-Instruct"
pipe = pipeline(
    "text-generation",
    model=model_id,
    torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
    device_map="auto",
    token=hf_token,
    trust_remote_code=True,
)

# Format chat messages
def format_chat(messages):
    prompt = "<|begin_of_text|>"
    for msg in messages:
        prompt += f"<|start_header_id|>{msg['role']}<|end_header_id|>\n{msg['content']}<|eot_id|>"
    prompt += "<|start_header_id|>assistant<|end_header_id|>\n"
    return prompt

# === Main KG Extraction Prompt ===
text_to_analyze = """
January 12, 2020
Dearest LOVies,
	I’ve been watching a good western on the telly so I’m late getting to my letter.  I’ve discovered a channel that has only westerns (oaters) and they are won derful.  Heavens they have excellent stars such as Robert Taylor,Alan Ladd,  Gregory Peck, Randolph Scott, etc.
	Not that I’m threatened by any of these hateful animals but I just wonder, why do we have to have alligators and crocodiles.  Are they any good for anything?  And mosquitos and noseeeums and sharks.  Surely after these zillions of years someone could have found a way to get rid of a lot of these disgusting lifeforms.
	At our Christmas party Cory had arranged for a beanbag throw.  When it was not being used  I bragged that I used to be a good fast-pitch softball player and my first throw went right in the hole!  The next few fell off to the right.  Oh well.
	I finished my puzzle “The Grand Canyon” in just a few days.  (It’s a good thing I checked my spelling because last week I discovered that my “z”s don’t work unless I go back and really pound on them.  Maybe it’s time to have an expert check this computer.) I thought I had lost a piece but  after searching everywhere, even laying a lamp on the floor to check under the couch, I stood the lamp up and voila!, there was the piece right at the base of the lamp.
	Rowan went through several test last week to se how bad his wheezing is and what can be done about it.  I hope he will get some answers this week.  He said once that he was going to do taxes again this year.   He has a lot of loyal clients.
	  It’s getting close to my bedtime, and yours, so say goodnight and I’ll see you again soon.  Love Mama


"""

messages = [
    {
        "role": "system",
        "content": (
            "You are an AI that extracts a knowledge graph from text. "
            "Return two lists:\n"
            "1. A list of nodes in the format: Node(id, label, type)\n"
            "2. A list of edges in the format: Edge(source_id, relation, target_id)\n"
            "Only extract real-world entities and clear relations from the text."
        ),
    },
    {
        "role": "user",
        "content": f"Extract a knowledge graph from the following text:\n\n{text_to_analyze}"
    },
]

# Generate
formatted_prompt = format_chat(messages)
outputs = pipe(
    formatted_prompt,
    max_new_tokens=512,
    do_sample=True,
    temperature=0.7,
    top_p=0.9,
)

# Print output
print("\n=== Extracted Knowledge Graph ===\n")
print(outputs[0]["generated_text"])
