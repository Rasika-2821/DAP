import requests
import time

# Start the server
import subprocess
import sys
import os

# Change to backend directory
os.chdir('d:/address-agent-central-main/backend')

# Start server
server = subprocess.Popen([sys.executable, '-m', 'app.main'])

# Wait for server to start
time.sleep(3)

try:
    # Test health endpoint
    response = requests.get('http://localhost:8000/health')
    print(f"Health check: {response.json()}")

    # Test docs endpoint
    response = requests.get('http://localhost:8000/docs')
    print(f"Docs available: {response.status_code == 200}")

    print("✅ FastAPI backend is working!")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔄 ReDoc: http://localhost:8000/redoc")

finally:
    server.terminate()
    server.wait()