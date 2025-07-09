#!/usr/bin/env python3
"""
Download Llama 3.1 8B after getting access approval
Uses HF_TOKEN from .env file via python-dotenv
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from huggingface_hub import login
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Load environment variables from .env file
def load_environment():
    """Load environment variables from .env file."""
    env_path = Path('.') / '.env'

    if env_path.exists():
        load_dotenv(env_path)
        print("✅ Loaded .env file")
        return True
    else:
        print("⚠️  .env file not found")
        print("💡 Create a .env file with: HF_TOKEN=your_token_here")
        return False

def download_llama_after_approval():
    """Download Llama after getting HF access using token from .env file."""

    # Load .env file
    if not load_environment():
        print("❌ Please create a .env file with your HF_TOKEN")
        return False

    # Get token from environment
    hf_token = os.getenv('HF_TOKEN')

    if not hf_token:
        print("❌ HF_TOKEN not found in .env file")
        print("💡 Add this line to your .env file:")
        print("   HF_TOKEN=your_token_here")
        return False

    # Validate token format
    if not hf_token.startswith('hf_'):
        print("⚠️  Warning: HF token should start with 'hf_'")
        print("💡 Make sure you copied the full token from HuggingFace")

    # Login with token
    print("🔑 Authenticating with Hugging Face...")
    try:
        login(token=hf_token)
        print("✅ Authentication successful")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        print("💡 Please check your HF_TOKEN in .env file")
        return False

    model_name = "meta-llama/Llama-3.1-8B-Instruct"

    print(f"🦙 Downloading {model_name}...")
    print("📊 Expected size: ~16GB")
    print("⏱️  This may take 10-30 minutes depending on your connection")

    try:
        # Download tokenizer first
        print("\n📥 Step 1/2: Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            token=hf_token
        )
        print("✅ Tokenizer downloaded successfully")

        # Download model
        print("\n📥 Step 2/2: Downloading model files...")
        print("   This is the large download - please be patient...")

        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            token=hf_token,
            torch_dtype=torch.float32,
            device_map="cpu",
            low_cpu_mem_usage=True,
            trust_remote_code=True,
        )
        print("✅ Model downloaded successfully!")

        # Quick functionality test
        print("\n🧪 Testing model functionality...")
        test_prompt = "The capital of France is"
        inputs = tokenizer(test_prompt, return_tensors="pt")

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=10,
                temperature=0.3,
                do_sample=True
            )

        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        print(f"✅ Model test successful!")
        print(f"   Test input: '{test_prompt}'")
        print(f"   Test output: '{response}'")

        return True

    except Exception as e:
        print(f"❌ Download error: {e}")

        # Provide helpful error messages
        error_str = str(e).lower()
        if "401" in error_str or "unauthorized" in error_str:
            print("\n💡 This is an authentication/access error:")
            print("   1. Check your HF_TOKEN is correct in .env file")
            print("   2. Make sure you have approval for Llama 3.1 8B")
            print("   3. Ensure you accepted the license terms")
        elif "404" in error_str:
            print("\n💡 Model not found error:")
            print("   1. Check the model name is correct")
            print("   2. Ensure you have access to the model")
        elif "connection" in error_str or "timeout" in error_str:
            print("\n💡 Network error:")
            print("   1. Check your internet connection")
            print("   2. Try again later")
        else:
            print(f"\n💡 Unexpected error: {e}")

        return False

def check_env_setup():
    """Check if .env file and token are properly set up."""
    print("🔍 Checking .env file setup...")

    env_path = Path('.') / '.env'

    if not env_path.exists():
        print("❌ .env file not found")
        print("\n💡 Create a .env file with this content:")
        print("   HF_TOKEN=your_token_here")
        return False

    # Load and check token
    load_dotenv(env_path)
    hf_token = os.getenv('HF_TOKEN')

    if not hf_token:
        print("❌ HF_TOKEN not found in .env file")
        return False

    if not hf_token.startswith('hf_'):
        print("⚠️  Warning: Token should start with 'hf_'")

    print("✅ .env file and HF_TOKEN found")

    # Test token validity
    try:
        from huggingface_hub import HfApi
        api = HfApi(token=hf_token)
        user_info = api.whoami()
        print(f"✅ Token is valid for user: {user_info.get('name', 'Unknown')}")
        return True
    except Exception as e:
        print(f"❌ Token validation failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Llama 3.1 8B Downloader")
    print("=" * 40)

    # Check setup first
    if not check_env_setup():
        print("\n❌ Setup check failed. Please fix the issues above.")
        exit(1)

    # Proceed with download
    success = download_llama_after_approval()

    if success:
        print("\n🎉 SUCCESS!")
        print("=" * 40)
        print("✅ Llama 3.1 8B is now downloaded and ready to use!")
        print("💡 You can now integrate it into your RAG system")
        print("📍 Model is cached in ~/.cache/huggingface/hub/")
    else:
        print("\n❌ DOWNLOAD FAILED")
        print("=" * 40)
        print("💡 Alternative: Try Llama 3.2 3B (no approval needed)")
        print("   model_name = 'meta-llama/Llama-3.2-3B-Instruct'")
