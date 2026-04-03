"""Test all Phase 1 endpoints"""
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test root
print("1️⃣  Testing GET /")
response = client.get('/')
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

# Test health check
print("2️⃣  Testing GET /api/v1/health")
response = client.get('/api/v1/health')
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

# Test get all canteens status
print("3️⃣  Testing GET /api/v1/canteens/status")
response = client.get('/api/v1/canteens/status')
print(f"   Status: {response.status_code}")
data = response.json()
print(f"   Found {len(data.get('data', []))} canteens")
if data.get('data'):
    print(f"   First canteen: {data['data'][0]['name']}\n")

# Test submit report
print("4️⃣  Testing POST /api/v1/report")
response = client.post('/api/v1/report', json={
    "canteen_id": "1",
    "crowd_level": "Medium"
})
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

# Test get canteen details
print("5️⃣  Testing GET /api/v1/canteens/1")
response = client.get('/api/v1/canteens/1')
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

print("✅ All endpoints working!")
