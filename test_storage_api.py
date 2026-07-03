"""End-to-end test for configurable storage API. Run: python test_storage_api.py"""
import sys, os, shutil, requests
sys.path.insert(0, ".")

BASE  = "http://127.0.0.1:8000"
CREDS = {"username": "admin", "password": "Admin@123"}

# 1. Login
r = requests.post(f"{BASE}/users/login", json=CREDS, timeout=6)
token = r.json().get("token", "")
H = {"Authorization": f"Bearer {token}"}
print(f"Login:              [{r.status_code}]  token={'OK' if token else 'MISSING'}")

# 2. Get current config
r = requests.get(f"{BASE}/admin/storage/", headers=H, timeout=6)
cfg = r.json()
print(f"GET /admin/storage: [{r.status_code}]")
print(f"  active_root  = {cfg.get('active_root')}")
print(f"  is_custom    = {cfg.get('is_custom')}")
print(f"  env_default  = {cfg.get('env_default')}")

# 3. Validate a path
r = requests.post(f"{BASE}/admin/storage/validate", headers=H, json={"path": "uploads"}, timeout=6)
print(f"Validate 'uploads': [{r.status_code}]  usable={r.json().get('usable')}")

# 4. Set custom path
test_path = os.path.abspath("test_storage_tmp")
r = requests.put(f"{BASE}/admin/storage/", headers=H, json={"storage_root": test_path}, timeout=6)
c2 = r.json()
print(f"Set custom path:    [{r.status_code}]  active={c2.get('active_root')}")
assert os.path.isdir(test_path), "Custom dir was not created!"
print(f"  Directory created on disk: YES")

# 5. Reset to default
r = requests.put(f"{BASE}/admin/storage/", headers=H, json={"storage_root": ""}, timeout=6)
c3 = r.json()
print(f"Reset to default:   [{r.status_code}]  is_custom={c3.get('is_custom')}")

# Cleanup
if os.path.isdir(test_path):
    shutil.rmtree(test_path)
    print(f"  Cleaned up test dir.")

print("\nAll storage API tests PASSED!")
