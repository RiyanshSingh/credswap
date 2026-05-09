import urllib.request
import json

url = "https://jmgqqkyjulgbyhubfacu.supabase.co/rest/v1/rpc/login_admin"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZ3Fxa3lqdWxnYnlodWJmYWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjE1NzMsImV4cCI6MjA4MTUzNzU3M30.kU5VrcULi40ZgP8o0AS4NEKs4ahw0gIezBT1QLj8WwU"

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

payload = {
    "p_username": "Riyansh",
    "p_password": "Riyansh123"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.getcode()}")
        print(f"Response: {response.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
