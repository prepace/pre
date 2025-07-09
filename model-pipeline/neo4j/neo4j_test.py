import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load variables from .env file automatically
load_dotenv()

def test_neo4j_connection():
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER")
    password = os.getenv("NEO4J_PASSWORD")

    driver = GraphDatabase.driver(uri, auth=(user, password))

    with driver.session() as session:
        result = session.run("RETURN 'Neo4j connection successful!' AS message")
        for record in result:
            print(record["message"])

    driver.close()

if __name__ == "__main__":
    test_neo4j_connection()
