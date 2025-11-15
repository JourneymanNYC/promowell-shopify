import os
import dotenv
from supabase import create_client, Client

dotenv.load_dotenv()  # Load environment variables from .env file

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

