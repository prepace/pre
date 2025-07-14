# RAG Chat System with Neo4j + Local LLM + FastAPI

from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from neo4j import GraphDatabase
from llama_cpp import Llama
import uuid
import os

# Load your LLM model (CPU friendly, adjust threads and context window)
llm = Llama(model_path="./models/phi-2.gguf", n_ctx=2048, n_threads=4)

# Neo4j driver setup (assumes local instance)
neo4j_driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

app = FastAPI()

# Upload and embed files to Neo4j
@app.post("/upload")
async def upload_file(file: UploadFile):
    text = (await file.read()).decode("utf-8")
    prompt = f"Extract (subject, relation, object) triples from this text:\n{text}\nReturn only the triples."
    llm_output = llm(prompt, stop=["\n"], max_tokens=512)["choices"][0]["text"]

    triples = [tuple(map(str.strip, line.split(','))) for line in llm_output.strip().split('\n') if line.count(',') == 2]

    with neo4j_driver.session() as session:
        for s, r, o in triples:
            session.run("""
                MERGE (a:Entity {name: $s})
                MERGE (b:Entity {name: $o})
                MERGE (a)-[:REL {type: $r}]->(b)
            """, s=s, o=o, r=r)

    return {"triples_added": len(triples)}

# User query for RAG-based chat
class Question(BaseModel):
    query: str

@app.post("/chat")
def chat_with_graph(query: Question):
    user_question = query.query
    cypher_prompt = f"""
    Convert the question to Cypher: {user_question}
    Examples:
    - Who is related to John? → MATCH (a:Entity {name: 'John'})-[:REL]->(b) RETURN b.name
    - What does Alice own? → MATCH (a:Entity {name: 'Alice'})-[:REL]->(b) RETURN type(r), b.name
    """
    cypher = llm(cypher_prompt, stop=["\n"], max_tokens=128)["choices"][0]["text"].strip()

    print(f"Generated Cypher: {cypher}")

    results = []
    try:
        with neo4j_driver.session() as session:
            output = session.run(cypher)
            for record in output:
                results.append(record.data())
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e), "cypher": cypher})

    context = f"Question: {user_question}\nGraph Result: {results}\nAnswer:"
    answer = llm(context, stop=["\n"], max_tokens=128)["choices"][0]["text"].strip()

    return {"question": user_question, "cypher": cypher, "results": results, "answer": answer}

# Optional health route
@app.get("/")
def root():
    return {"message": "RAG Chat with Neo4j + LLM is running!"}
