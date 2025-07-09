"""
RAG Chat System with Llama 3.1 8B support - focused on Q&A only.
"""
import os
import re
import torch
from typing import Dict, Optional
from dotenv import load_dotenv
from huggingface_hub import login
from transformers import AutoTokenizer, AutoModelForCausalLM

# Load environment variables
load_dotenv()

class RAGChatSystem:
    """RAG Chat System optimized for Llama 3.1 8B - Q&A only."""

    def __init__(self, model_name: str = "meta-llama/Llama-3.2-1B-Instruct"):
        self.model_name = model_name
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'

        # Setup authentication
        self._setup_authentication()

        print(f"\n🦙 Loading {model_name} on {self.device}...")

        # Load model
        self._load_model()

        # Context storage (populated by text_processor.py)
        self.graph_data = None
        self.original_text = ""
        self.extracted_patterns = {}

        # System prompt
        self.system_prompt = """You are a helpful AI assistant that answers questions based strictly on the provided context.

Rules:
- Answer only using information from the context provided
- Be concise and specific
- If asked for a list, provide ONLY the requested items
- If information is not in the context, say "I don't have that information in the provided context"
- For family relationships, be precise about relationship types"""

    def _setup_authentication(self):
        """Setup HuggingFace authentication."""
        hf_token = os.getenv('HF_TOKEN')

        if hf_token:
            try:
                login(token=hf_token)
                print("✅ HuggingFace authentication successful")
            except Exception as e:
                print(f"⚠️  Authentication failed: {e}")
        else:
            print("⚠️  HF_TOKEN not found - trying without authentication")

    def _load_model(self):
        """Load Llama model with fallbacks."""
        hf_token = os.getenv('HF_TOKEN')

        try:
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                token=hf_token
            )

            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            # Load model
            if self.device == 'cuda':
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_name,
                    token=hf_token,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    low_cpu_mem_usage=True
                )
            else:
                # CPU optimization for your VM
                torch.set_num_threads(19)
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_name,
                    token=hf_token,
                    torch_dtype=torch.float32,
                    device_map="cpu",
                    low_cpu_mem_usage=True,
                    max_memory={0: "39GB"}
                )

            self.model.eval()
            print("✅ Model loaded successfully!")

        except Exception as e:
            print(f"❌ Error loading {self.model_name}: {e}")

            # Try fallback
            fallback = "meta-llama/Llama-3.2-3B-Instruct"
            try:
                print(f"🔄 Trying fallback: {fallback}")
                self.model_name = fallback

                self.tokenizer = AutoTokenizer.from_pretrained(fallback, token=hf_token)
                if self.tokenizer.pad_token is None:
                    self.tokenizer.pad_token = self.tokenizer.eos_token

                self.model = AutoModelForCausalLM.from_pretrained(
                    fallback,
                    token=hf_token,
                    torch_dtype=torch.float32 if self.device == 'cpu' else torch.float16,
                    device_map="cpu" if self.device == 'cpu' else "auto",
                    low_cpu_mem_usage=True
                )

                self.model.eval()
                print(f"✅ Fallback model loaded: {fallback}")

            except Exception as e2:
                raise Exception(f"❌ Unable to load any model: {e2}")

    def set_context(self, graph_data: Dict, original_text: str, extracted_patterns: Dict):
        """Set the context from processed data (from text_processor.py)."""
        self.graph_data = graph_data
        self.original_text = original_text
        self.extracted_patterns = extracted_patterns

    def build_prompt(self, question: str) -> str:
        """Build context-aware prompt based on question type."""
        question_lower = question.lower()

        # Route to specific prompt builders
        if any(word in question_lower for word in ['email', 'e-mail', 'mail']):
            return self._build_email_prompt(question)
        elif any(word in question_lower for word in ['phone', 'number', 'tel']):
            return self._build_phone_prompt(question)
        elif any(word in question_lower for word in ['address', 'location', 'street']):
            return self._build_address_prompt(question)
        elif any(word in question_lower for word in ['how many', 'count']):
            return self._build_count_prompt(question)
        else:
            return self._build_general_prompt(question)

    def _build_email_prompt(self, question: str) -> str:
        """Build prompt for email queries."""
        emails = set()

        # Get emails from patterns
        if self.extracted_patterns.get('emails'):
            emails.update(email['text'] for email in self.extracted_patterns['emails'])

        # Get emails from identities
        if self.extracted_patterns.get('identities'):
            for identity in self.extracted_patterns['identities']:
                if identity.get('emails'):
                    emails.update(identity['emails'])

        return f"""{self.system_prompt}

Context: Email addresses found: {', '.join(emails) if emails else 'None'}

Question: {question}
Answer:"""

    def _build_phone_prompt(self, question: str) -> str:
        """Build prompt for phone queries."""
        phones = set()

        # Get phones from patterns
        if self.extracted_patterns.get('phones'):
            phones.update(phone['text'] for phone in self.extracted_patterns['phones'])

        # Get phones from identities
        if self.extracted_patterns.get('identities'):
            for identity in self.extracted_patterns['identities']:
                if identity.get('phones'):
                    phones.update(identity['phones'])

        return f"""{self.system_prompt}

Context: Phone numbers found: {', '.join(phones) if phones else 'None'}

Question: {question}
Answer:"""

    def _build_address_prompt(self, question: str) -> str:
        """Build prompt for address queries."""
        addresses = set()

        # Get addresses from patterns
        if self.extracted_patterns.get('addresses'):
            addresses.update(addr['text'] for addr in self.extracted_patterns['addresses'])

        # Get addresses from identities
        if self.extracted_patterns.get('identities'):
            for identity in self.extracted_patterns['identities']:
                if identity.get('addresses'):
                    addresses.update(identity['addresses'])

        return f"""{self.system_prompt}

Context: Addresses found: {'; '.join(addresses) if addresses else 'None'}

Question: {question}
Answer:"""

    def _build_count_prompt(self, question: str) -> str:
        """Build prompt for counting questions."""
        question_lower = question.lower()

        if 'people' in question_lower or 'identit' in question_lower:
            count = len(self.extracted_patterns.get('identities', []))
            return f"""{self.system_prompt}

Context: {count} people were identified in the text.

Question: {question}
Answer:"""

        # For other count questions, use general prompt
        return self._build_general_prompt(question)

    def _build_general_prompt(self, question: str) -> str:
        """Build general context prompt."""
        context_parts = []

        # Add text excerpt
        if self.original_text:
            text_preview = self.original_text[:600] + "..." if len(self.original_text) > 600 else self.original_text
            context_parts.append(f"Source text: {text_preview}")

        # Add people information
        if self.extracted_patterns.get('identities'):
            people_info = []
            for identity in self.extracted_patterns['identities'][:10]:  # Limit to 10
                info = [f"{identity['person']}"]
                if identity.get('addresses'):
                    info.append(f"Address: {', '.join(identity['addresses'])}")
                if identity.get('phones'):
                    info.append(f"Phone: {', '.join(identity['phones'])}")
                if identity.get('emails'):
                    info.append(f"Email: {', '.join(identity['emails'])}")
                people_info.append(' - '.join(info))

            if people_info:
                context_parts.append(f"People found: {'; '.join(people_info)}")

        context = '\n\n'.join(context_parts)

        return f"""{self.system_prompt}

Context:
{context}

Question: {question}
Answer:"""

    def generate_answer(self, question: str, max_length: int = 200) -> str:
        """Generate answer using Llama model."""
        prompt = self.build_prompt(question)

        # Tokenize
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048
        ).to(self.device)

        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_length,
                temperature=0.3,
                do_sample=True,
                top_p=0.9,
                repetition_penalty=1.1,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        # Decode and extract answer
        full_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Extract answer
        if "Answer:" in full_text:
            answer = full_text.split("Answer:")[-1].strip()
        else:
            answer = full_text[len(prompt):].strip()

        # Clean up
        answer = self._clean_answer(answer, question)

        return answer

    def _clean_answer(self, answer: str, question: str) -> str:
        """Clean up generated answer."""
        # Remove common artifacts
        stop_patterns = [
            '\n\nQuestion:', '\n\nContext:', '\n\nAnswer:',
            '\n\n---', '\n\n___', '<|user|>', '<|assistant|>'
        ]

        for pattern in stop_patterns:
            if pattern in answer:
                answer = answer.split(pattern)[0].strip()

        # Post-process for specific question types
        question_lower = question.lower()

        if 'list' in question_lower or 'all' in question_lower:
            if 'email' in question_lower:
                # Extract emails from answer
                email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                found_emails = re.findall(email_pattern, answer)
                if found_emails:
                    return ', '.join(found_emails)

            elif 'phone' in question_lower:
                # Extract phone numbers from answer
                phone_pattern = r'[\d\s\-$$$$\.]+\d'
                found_phones = re.findall(phone_pattern, answer)
                found_phones = [p.strip() for p in found_phones if len(p.strip()) >= 7]
                if found_phones:
                    return ', '.join(found_phones)

        return answer.strip()
