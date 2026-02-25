"""
Test configuration and fixtures for cog-core.
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add src to path for imports
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))


@pytest.fixture
def sample_python_code():
    """Sample Python code for testing."""
    return '''
import os
from typing import List

class UserService:
    """Handle user operations."""
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    def get_user(self, user_id: int):
        """Fetch user by ID."""
        return self.db.query(f"SELECT * FROM users WHERE id = {user_id}")
    
    def create_user(self, name: str, email: str):
        """Create a new user."""
        config = load_config()
        return self.db.execute("INSERT INTO users VALUES (?, ?)", (name, email))

def load_config():
    """Load configuration from file."""
    with open("config.json", "r") as f:
        return f.read()

def process_data(input_data: List[str]):
    """Process input data."""
    result = []
    for item in input_data:
        result.append(item.upper())
    return result

async def async_handler(request):
    """Async request handler."""
    response = await request.get("/api/data")
    return response
'''


@pytest.fixture
def sample_javascript_code():
    """Sample JavaScript code for testing."""
    return """
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    async fetchData(endpoint) {
        const response = await fetch(this.baseUrl + endpoint);
        return response.json();
    }
}

function processData(data) {
    return data.map(item => item.value);
}

const handler = (req, res) => {
    res.send("Hello");
};
"""


@pytest.fixture
def mock_sentence_transformer():
    """Mock SentenceTransformer for testing without model."""
    mock_model = MagicMock()
    mock_model.encode.return_value = [0.1] * 768  # 768-dimensional vector
    return mock_model


@pytest.fixture
def mock_lancedb():
    """Mock LanceDB for testing without database."""
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_db.connect.return_value = mock_db
    mock_db.create_table.return_value = mock_table
    mock_db.open_table.return_value = mock_table
    mock_table.search.return_value.limit.return_value.to_list.return_value = [
        {
            "filename": "test.py",
            "path": "/test/test.py",
            "symbol": "foo",
            "text": "def foo(): pass",
            "_distance": 0.1,
        }
    ]
    return mock_db
