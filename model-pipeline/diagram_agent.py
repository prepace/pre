import os
from dotenv import load_dotenv
from huggingface_hub import login
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load the .env file and Hugging Face token
load_dotenv()
hf_token = os.getenv("HF_TOKEN")
login(token=hf_token)

# Load model and tokenizer
model_name = "DiagramAgent/Code_Agent"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype="auto",
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Construct and tokenize message
messages = [
    {"role": "user", "content": "You are a diagram agent. Please generate a diagram based on the following description: 'A flowchart showing the process of photosynthesis in plants.'"}
]
text = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True
)
model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

# Generate response
generated_ids = model.generate(
    **model_inputs,
    max_new_tokens=8192
)
generated_ids = [
    output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
]
response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

# Output result
print(response)
