# Knowledge Graph Visualization App

A full-stack application that extracts entities and relationships from text documents and visualizes them as interactive knowledge graphs using advanced NLP models.

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Installation](#-installation)
  - [Prerequisites](#-prerequisites)
  - [Frontend Setup](#-frontend-setup)
  - [Backend Setup](#-backend-setup-nlp-pipeline)
  - [Environment Configuration](#-environment-configuration)
- [Models & Entity Types](#-models--entity-types)
  - [spaCy NER](#1-spacy-ner-en_core_web_sm)
  - [FewNERD (NuNER-v2)](#2-fewnerd-nuner-v2)
- [Framework Versions](#-framework-versions)
- [Training Performance](#-training-performance)
- [Usage](#-usage)
  - [API Endpoint](#-api-endpoint)
  - [Example Input](#-example-input)
  - [Sample Output](#-sample-output)
  - [Quick Inference Example](#-quick-inference-example-fewnerd-via-hugging-face)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Key Files](#-key-files)
- [License](#-license)
- [Contributing](#-contributing)

---

## 🧠 Overview

This app combines:

- **Frontend**: [Next.js](https://nextjs.org/) + [React Flow](https://reactflow.dev/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) with NLP pipelines
- **NLP Models**: [spaCy](https://spacy.io/) and [FewNERD (NuNER-v2)](https://huggingface.co/guishe/nuner-v2_fewnerd_fine_super)

---

## ⚙️ Installation

### ✅ Prerequisites

- Node.js v16+
- Python 3.8+
- npm or yarn

---

### 🔧 Frontend Setup

```bash
git clone https://github.com/your-repo-url.git
cd your-app-root
npm install
```

### ▶️ Start Frontend

```bash
npm run dev
```

> The frontend will run at **http://localhost:3000**

---

### 🧪 Backend Setup (NLP Pipeline)

```bash
cd model-pipeline
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

> The FastAPI server will be available at **http://localhost:8000**

💾 **Note**: Model downloads may take up to 2 GB of space on first run.

---

### 🌐 Environment Configuration

Create a `.env.local` file in the root of your project and add the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_NER_URL=http://localhost:8000/process
NEXT_PUBLIC_NER_DEVELOPMENT_URL=http://localhost:8001/process
```

> Replace the placeholders above with your actual **Supabase** credentials and **NER API URLs** if using different ports or environments.

---

## 🧬 Models & Entity Types

### 1. `spaCy` NER: `en_core_web_sm`

Common entity types:

- **PERSON**: People, fictional or real
- **NORP**: Nationalities, religious/political groups
- **FAC**: Buildings, bridges, airports, highways
- **ORG**: Organizations, companies, agencies
- **GPE**: Countries, cities, states
- **LOC**: Non-GPE locations (e.g. oceans, mountains)
- **PRODUCT**: Physical items (vehicles, foods, etc.)
- **EVENT**: Named events (wars, hurricanes)
- **WORK_OF_ART**: Titles of books, films, songs
- **LAW**: Legal documents
- **LANGUAGE**: Named human languages
- **DATE**: Absolute or relative dates
- **TIME**: Specific times within a day
- **PERCENT**: Percentages
- **MONEY**: Currency amounts
- **QUANTITY**: Measurable quantities (e.g. km)
- **ORDINAL**: Rank order (first, second)
- **CARDINAL**: Numbers not classified elsewhere

---

### 2. FewNERD (NuNER-v2)

Model: `guishe/nuner-v2_fewnerd_fine_super`
Fine-tuned using Hugging Face's `Trainer` class on the FewNERD dataset.

#### 📚 Citation

```bibtex
@misc{bogdanov2024nuner,
  title={NuNER: Entity Recognition Encoder Pre-training via LLM-Annotated Data},
  author={Sergei Bogdanov and Alexandre Constantin and Timothée Bernard and Benoit Crabbé and Etienne Bernard},
  year={2024},
  eprint={2402.15343},
  archivePrefix={arXiv},
  primaryClass={cs.CL}
}
```

---

## 📦 Framework Versions

- `Transformers`: 4.39.3
- `PyTorch`: 2.2.0+cu121
- `Datasets`: 2.18.0
- `Tokenizers`: 0.15.2

---

## 📊 Training Performance

| Epoch | Training Loss | Val Loss | Precision | Recall | F1     | Accuracy |
|-------|----------------|----------|-----------|--------|--------|----------|
| 1     | 0.2602         | 0.2486   | 0.6570    | 0.7031 | 0.6793 | 0.9270   |
| 2     | 0.2199         | 0.2369   | 0.6791    | 0.7043 | 0.6915 | 0.9302   |
| 3     | 0.2052         | 0.2349   | 0.6785    | 0.7143 | 0.6959 | 0.9312   |
| 4     | 0.1835         | 0.2362   | 0.6810    | 0.7160 | 0.6981 | 0.9313   |

**Training Hyperparameters:**

- Learning rate: `3e-05`
- Batch size: 32 (gradient accumulation: 2 → total: 64)
- Optimizer: Adam (`betas=(0.9, 0.999)`, `eps=1e-08`)
- LR Scheduler: linear (warmup ratio: `0.1`)
- Epochs: `4`
- Seed: `42`

---

## 🚀 Usage

### 📡 API Endpoint

```
POST http://localhost:8000/process
Content-Type: application/json
```

**Request Body:**

```json
{
  "text": "Your text document here..."
}
```

---

### 🧾 Example Input

```txt
From: John Smith
To: Sarah Johnson, Michael Brown
Date: October 15, 2023
Subject: Family Updates

Dear Sarah and Michael,
I hope this letter finds you well at 123 Oak Street...
```

---

### 📤 Sample Output

```json
{
  "nodes": [
    {
      "id": "John Smith",
      "label": "John Smith",
      "type": "PERSON"
    }
  ],
  "edges": [
    {
      "source": "John Smith",
      "target": "letter-October 15, 2023",
      "relation": "wrote"
    }
  ]
}
```

---

### 🧪 Quick Inference Example (FewNERD via Hugging Face)

```python
from transformers import pipeline

text = """Foreign governments may be spying on your smartphone notifications..."""

classifier = pipeline("ner", model="guishe/nuner-v2_fewnerd_fine_super", aggregation_strategy="simple")
results = classifier(text)
print(results)
```

---

## ✨ Features

- 🧠 **Entity Recognition** (names, places, dates, etc.)
- 🔗 **Relationship Extraction** (who did what to whom)
- 🧍 **Identity Resolution** (grouping related contact info)
- 📈 **Interactive Graph UI** with expandable nodes
- 🔍 **Search & Filter** by entity type or name
- ⚡ **Real-time Inference** with FastAPI

---

## 🏗️ System Architecture

```
┌────────────────────┐     ┌────────────────────┐
│                    │     │                    │
│   Next.js Frontend │────▶│   FastAPI Backend  │
│   (Port 3000)      │     │   (Port 8000)      │
│                    │     │                    │
└────────────────────┘     └────────────────────┘
        │                           │
        │                           ├── spaCy
        │                           ├── FewNERD (NuNER-v2)
        └── React Flow              └── NetworkX
```

---

## 📂 Key Files

- UI Component: `components/EnhancedExpandableGraph.jsx`
- Backend API: `model-pipeline/app.py`
- Entity Cleanup: `model-pipeline/post_process.py`

---

## 📄 License

[MIT / Apache-2.0 / Custom — *Insert here based on your choice*]

---

## 🤝 Contributing

We welcome contributions! Please open issues or PRs for improvements or bug reports.
[Insert detailed contributing guidelines here if available]

---

> This README provides comprehensive setup, usage, and technical background for developers or contributors interested in understanding and expanding the project.
