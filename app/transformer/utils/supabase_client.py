import os
import dotenv
from supabase import create_client, Client

dotenv.load_dotenv()  # Load environment variables from .env file

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
service_role_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Regular client (respects RLS)
supabase: Client = create_client(url, key)

# Admin client (bypasses RLS) - use for backend jobs
supabase_admin: Client = create_client(url, service_role_key) if service_role_key else supabase

