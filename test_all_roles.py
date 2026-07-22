"""
Test login authentication for all active roles (Admin, Manager, Engineer).
Run: python test_all_roles.py
"""
import sys; sys.path.insert(0, ".")
from backend.database.init_db import SessionLocal
from backend.services.user_service import authenticate_user

CREDS = [
    ("admin",    "Admin@123",    "Admin"),
    ("engineer", "Engineer@123", "Engineer"),
    ("manager",  "Manager@123",  "Manager"),
]

print("\n=== Role Authentication Tests ===\n")
db = SessionLocal()
all_ok = True

try:
    for username, password, expected_role in CREDS:
        try:
            user = authenticate_user(db, username, password)
            role = user.role
            ok = (role == expected_role)
            print(f"  {'OK  ' if ok else 'FAIL'} [200]  {username:12} -> role={role:10}  email={user.email or 'N/A'}")
            if not ok:
                all_ok = False
        except Exception as err:
            print(f"  FAIL [ERR]  {username:12} -> {err}")
            all_ok = False
finally:
    db.close()

print()
print("All active roles authenticated successfully!" if all_ok else "Some roles failed -- check above.")
