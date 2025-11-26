"""
Temporary RAG Retriever for testing RAGNode with postgres backend.

This file is a standalone implementation that mimics the taboolabot-api
MosaicKnowledgeCenterService for testing purposes. It can be easily removed
after testing.

Usage in main.py:
    from rag_retriever_temp import create_rag_retriever

    rag_retriever = create_rag_retriever(
        db_url="postgresql://user:pass@localhost:5432/dbname",
        openai_api_key="sk-..."
    )

    # Inject into graphs during execution
    for node in graph.nodes.values():
        if isinstance(node, RAGNode):
            node.set_retriever(rag_retriever)
"""

import os
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from openai import AsyncOpenAI


class SimpleRAGRetriever:
    """
    Simplified RAG retriever that connects directly to postgres with pgvector.

    Requires:
    - PostgreSQL database with pgvector extension
    - Tables: mosaic_kc_files, mosaic_kc_file_chunks
    - Function: match_document_chunks_by_file(vector, uuid, float, int)

    Example:
        retriever = SimpleRAGRetriever(
            db_url="postgresql://user:pass@host:port/dbname",
            openai_api_key="sk-..."
        )

        results = await retriever.search_file(
            query="cats in hot weather",
            file_id="uuid-123",
            similarity_threshold=0.7,
            limit=5
        )
    """

    def __init__(self, db_url: str, openai_api_key: str):
        """
        Initialize retriever with database connection and OpenAI client.

        Args:
            db_url: PostgreSQL connection URL (e.g., postgresql://user:pass@host:port/dbname)
            openai_api_key: OpenAI API key for generating embeddings
        """
        self.db_url = db_url
        self.engine = create_engine(db_url, pool_pre_ping=True)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.openai_client = AsyncOpenAI(api_key=openai_api_key)

    @contextmanager
    def get_session(self):
        """Context manager for database sessions."""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    async def _generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding for a query string using OpenAI.

        Args:
            query: Search query text

        Returns:
            List of 1536 floats (text-embedding-3-small dimensions)
        """
        response = await self.openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        return response.data[0].embedding

    async def search_file(
        self,
        query: str,
        file_id: str,
        similarity_threshold: float = 0.7,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search within a specific file using vector similarity.

        Args:
            query: Search query text
            file_id: UUID of the file to search
            similarity_threshold: Minimum similarity score (0.0-1.0)
            limit: Maximum number of results

        Returns:
            List of document chunks with metadata:
            [
                {
                    "id": "uuid",
                    "document_id": "uuid",
                    "content": "text content",
                    "token_count": 100,
                    "page_number": 5,
                    "heading": "Section Title",
                    "similarity": 0.89,
                    "file_title": "Document.pdf",
                    "folder_uuid": "uuid"
                },
                ...
            ]
        """
        try:
            # Generate embedding for query
            query_embedding = await self._generate_query_embedding(query)

            # Search chunks in the specific file using postgres function
            with self.get_session() as session:
                result = session.execute(
                    text("""
                        SELECT * FROM match_document_chunks_by_file(
                            CAST(:embedding AS vector(1536)),
                            CAST(:file_id AS uuid),
                            :threshold,
                            :count
                        )
                    """),
                    {
                        "embedding": str(query_embedding),
                        "file_id": file_id,
                        "threshold": similarity_threshold,
                        "count": limit,
                    },
                )
                rows = result.fetchall()

                # Convert to list of dicts
                return [dict(row._mapping) for row in rows]

        except Exception as e:
            raise Exception(f"Error searching file: {str(e)}")

    async def search_folder(
        self,
        query: str,
        folder_uuid: str,
        similarity_threshold: float = 0.7,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search across all files in a folder using vector similarity.

        Args:
            query: Search query text
            folder_uuid: UUID of the folder to search
            similarity_threshold: Minimum similarity score (0.0-1.0)
            limit: Maximum number of results

        Returns:
            List of document chunks with metadata (same structure as search_file)
        """
        try:
            # Generate embedding for query
            query_embedding = await self._generate_query_embedding(query)

            with self.get_session() as session:
                # Step 1: Get all document IDs in this folder
                doc_ids_result = session.execute(
                    text("""
                        SELECT id FROM mosaic_kc_files
                        WHERE folder_uuid = :folder_uuid AND status = 'processed'
                    """),
                    {"folder_uuid": folder_uuid}
                )
                doc_ids = [row[0] for row in doc_ids_result.fetchall()]

                if not doc_ids:
                    return []

                # Step 2: Search chunks for each document
                results_list = []
                for doc_id in doc_ids:
                    file_results = session.execute(
                        text("""
                            SELECT * FROM match_document_chunks_by_file(
                                CAST(:embedding AS vector(1536)),
                                :file_id,
                                :threshold,
                                :count
                            )
                        """),
                        {
                            "embedding": str(query_embedding),
                            "file_id": doc_id,
                            "threshold": similarity_threshold,
                            "count": limit,
                        },
                    ).fetchall()
                    results_list.extend([dict(row._mapping) for row in file_results])

                # Sort by similarity and limit
                results_list.sort(key=lambda x: x['similarity'], reverse=True)
                return results_list[:limit]

        except Exception as e:
            raise Exception(f"Error searching folder: {str(e)}")

    def close(self):
        """Close database engine."""
        self.engine.dispose()


def create_rag_retriever(
    db_url: Optional[str] = None,
    openai_api_key: Optional[str] = None
) -> SimpleRAGRetriever:
    """
    Factory function to create a RAG retriever with environment variable fallback.

    Args:
        db_url: PostgreSQL connection URL (defaults to DATABASE_URL env var)
        openai_api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)

    Returns:
        Configured SimpleRAGRetriever instance

    Raises:
        ValueError: If required credentials are missing

    Example:
        # Option 1: Explicit credentials
        retriever = create_rag_retriever(
            db_url="postgresql://user:pass@localhost:5432/dbname",
            openai_api_key="sk-..."
        )

        # Option 2: Use environment variables
        # export DATABASE_URL="postgresql://..."
        # export OPENAI_API_KEY="sk-..."
        retriever = create_rag_retriever()
    """
    # Get credentials from args or environment
    db_url = db_url or os.getenv("DATABASE_URL")
    openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")

    # Validate
    if not db_url:
        raise ValueError(
            "Database URL required. Provide db_url argument or set DATABASE_URL environment variable."
        )
    if not openai_api_key:
        raise ValueError(
            "OpenAI API key required. Provide openai_api_key argument or set OPENAI_API_KEY environment variable."
        )

    return SimpleRAGRetriever(db_url=db_url, openai_api_key=openai_api_key)


# Example usage and testing
if __name__ == "__main__":
    import asyncio

    async def test_retriever():
        """Test the retriever with sample queries."""
        # Create retriever (uses env vars by default)
        retriever = create_rag_retriever()

        try:
            # Test file search
            print("Testing file search...")
            results = await retriever.search_file(
                query="test query",
                file_id="your-file-uuid-here",
                similarity_threshold=0.5,
                limit=3
            )
            print(f"Found {len(results)} results")
            for idx, result in enumerate(results, 1):
                print(f"\n{idx}. {result.get('file_title')} (similarity: {result.get('similarity'):.2%})")
                print(f"   {result.get('content')[:100]}...")

        finally:
            retriever.close()

    # Uncomment to test
    # asyncio.run(test_retriever())
