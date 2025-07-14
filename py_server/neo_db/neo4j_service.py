import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Neo4jService:
    def __init__(self):
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USER")
        password = os.getenv("NEO4J_PASSWORD")

        if not all([uri, user, password]):
            raise ValueError("Missing Neo4j connection credentials in environment.")

        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self._driver.close()

    def query(self, cypher, parameters=None):
        with self._driver.session() as session:
            result = session.run(cypher, parameters or {})
            return [record.data() for record in result]
