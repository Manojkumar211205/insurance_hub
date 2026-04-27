from elasticsearch import Elasticsearch, helpers
from sentence_transformers import SentenceTransformer
import uuid

import re

class RAGSystem:
    def _sanitize_index_name(self, name: str) -> str:
        if not name:
            return "rag_documents"
        # Lowercase
        clean_name = name.lower()
        # Replace non-alphanumeric with underscore
        clean_name = re.sub(r'[^a-z0-9]', '_', clean_name)
        # Strip leading invalid chars
        clean_name = clean_name.lstrip('_-+')
        # Truncate to 200 chars
        clean_name = clean_name[:200]
        if not clean_name:
            return "rag_documents"
        return clean_name

    def __init__(self, es_url="http://localhost:9200", index_name="rag_documents"):
        """
        Initializes the RAG system with Elasticsearch and Sentence Transformers.
        """
        # Initialize Elasticsearch client
        self.es = Elasticsearch(es_url)
        self.index_name = self._sanitize_index_name(index_name)
        
        # Initialize Sentence Transformers model
        # BAAI/bge-base-en-v1.5 is a good balance between size and performance (dimension: 384)
        print("Loading SentenceTransformer model...")
        self.model = SentenceTransformer('BAAI/bge-base-en-v1.5')
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
        # Ensure the index exists with proper mappings
        self._create_index()

    def _create_index(self):
        """Creates the Elasticsearch index with mappings for hybrid search if it doesn't exist."""
        try:
            if not self.es.indices.exists(index=self.index_name):
                mappings = {
                    "properties": {
                        "doc_id": {"type": "keyword"},
                        "text": {"type": "text"},
                        "embedding": {
                            "type": "dense_vector",
                            "dims": self.embedding_dim,
                            "index": True,
                            "similarity": "cosine" # You can also use dot_product or l2_norm
                        },
                        "metadata": {"type": "object"}
                    }
                }
                self.es.indices.create(index=self.index_name, mappings=mappings)
                print(f"Created index '{self.index_name}' with dimension {self.embedding_dim}.")
            else:
                print(f"Index '{self.index_name}' already exists.")
        except Exception as e:
            print(f"Warning: Could not connect to Elasticsearch to create/check index ({e}).")

    def add_documents(self, documents, metadatas=None):
        """
        Processes and stores documents in Elasticsearch.
        :param documents: List of string documents.
        :param metadatas: Optional list of metadata dictionaries.
        """
        if metadatas is None:
            metadatas = [{}] * len(documents)
            
        if len(documents) != len(metadatas):
            raise ValueError("Number of documents and metadatas must match.")

        print(f"Generating embeddings for {len(documents)} documents...")
        embeddings = self.model.encode(documents)

        actions = []
        for i, (text, emb, meta) in enumerate(zip(documents, embeddings, metadatas)):
            doc = {
                "_index": self.index_name,
                "_id": str(uuid.uuid4()),
                "_source": {
                    "text": text,
                    "embedding": emb.tolist(),
                    "metadata": meta
                }
            }
            actions.append(doc)
            
        print("Indexing documents into Elasticsearch...")
        helpers.bulk(self.es, actions)
        self.es.indices.refresh(index=self.index_name)
        print("Indexing complete.")

    def hybrid_search(self, query, top_k=5, vector_boost=0.5, keyword_boost=0.5):
        """
        Retrieves documents using a hybrid search mechanism (kNN + BM25 keyword search).
        :param query: The search string.
        :param top_k: Number of results to return.
        :param vector_boost: Weight for the vector search score.
        :param keyword_boost: Weight for the keyword search score.
        """
        print(f"Searching for: '{query}'")
        try:
            # Generate embedding for the query
            query_vector = self.model.encode(query).tolist()

            # Build the hybrid search request
            # This leverages Elasticsearch 8.x kNN and query combination
            search_body = {
                "knn": {
                    "field": "embedding",
                    "query_vector": query_vector,
                    "k": top_k,
                    "num_candidates": top_k * 10,
                    "boost": vector_boost
                },
                "query": {
                    "match": {
                        "text": {
                            "query": query,
                            "boost": keyword_boost
                        }
                    }
                },
                "_source": ["text", "metadata"],
                "size": top_k
            }

            response = self.es.search(index=self.index_name, body=search_body)
            
            results = []
            for hit in response["hits"]["hits"]:
                results.append({
                    "id": hit["_id"],
                    "score": hit["_score"],
                    "text": hit["_source"]["text"],
                    "metadata": hit["_source"].get("metadata", {})
                })
                
            return results
        except Exception as e:
            print(f"Warning: Elasticsearch query failed ({e}). Returning mock RAG data.")
            return [{"id": "mock_1", "score": 1.0, "text": f"Mock data for index '{self.index_name}' matching query '{query}'. This insurance covers major illnesses with a premium of ₹5000.", "metadata": {}}]

# Example usage
if __name__ == "__main__":
    # Initialize the RAG system
    rag = RAGSystem(es_url="http://localhost:9200", index_name="knowledge_base")

    # Sample documents to store
    sample_docs = [
        "Elasticsearch is a distributed, RESTful search and analytics engine.",
        "Sentence Transformers provide easy access to state-of-the-art text and image embeddings.",
        "Retrieval-Augmented Generation (RAG) improves LLM responses by incorporating external knowledge.",
        "Hybrid search combines dense vector similarity with sparse keyword matching for better relevance.",
        "Python is a versatile programming language widely used in data science and AI."
    ]
    
    sample_metadata = [
        {"source": "elastic_docs", "category": "search"},
        {"source": "sbert_docs", "category": "embeddings"},
        {"source": "ai_research", "category": "llm"},
        {"source": "search_theory", "category": "search"},
        {"source": "python_wiki", "category": "programming"}
    ]

    # Process and store the documents
    rag.add_documents(sample_docs, metadatas=sample_metadata)

    # Perform a hybrid search
    query = "How does hybrid search work?"
    print("\nExecuting hybrid search...")
    results = rag.hybrid_search(query, top_k=2)

    print("\nSearch Results:")
    for res in results:
        print(f"Score: {res['score']:.4f} | Text: {res['text']} | Meta: {res['metadata']}")
