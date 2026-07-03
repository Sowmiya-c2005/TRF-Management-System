"""Test login for all 4 roles. Run: python test_all_roles.py"""
import sys; sys.path.insert(0, ".")
import requests

BASE = "http://127.0.0.1:8000"

CREDS = [
    ("admin",    "Admin@123",    "Admin"),
    ("engineer", "Engineer@123", "Engineer"),
    ("manager",  "Manager@123",  "Manager"),
    ("viewer",   "Viewer@123",   "Viewer"),
]

print("\n=== Role Login Tests ===\n")
all_ok = True

for username, password, expected_role in CREDS:
    r = requests.post(f"{BASE}/users/login", json={"username": username, "password": password}, timeout=6)
    if r.status_code == 200:
        data = r.json()
        role = data.get("role", "?")
        token_ok = bool(data.get("token"))
        ok = role == expected_role and token_ok
        print(f"  {'OK  ' if ok else 'FAIL'} [{r.status_code}]  {username:12} → role={role:10}  token={'YES' if token_ok else 'NO '}")
        if not ok: all_ok = False
    else:
        print(f"  FAIL [{r.status_code}]  {username:12} → {r.text[:80]}")
        all_ok = False

print()
print("All roles working!" if all_ok else "Some roles failed — check above.")
