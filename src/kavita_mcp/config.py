import os

from dotenv import load_dotenv

load_dotenv()
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "11189"))
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", "11190"))
MOCK_MODE = os.getenv("MOCK_MODE", "1") == "1" or not os.getenv("KAVITA_URL")
API_URL = os.getenv("KAVITA_URL", "http://localhost:5000")
API_KEY = os.getenv("KAVITA_API_KEY", "")
