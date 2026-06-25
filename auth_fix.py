"""
auth_fix.py  —  Diagnose & fix the TRF admin account, then test the login API end-to-end.
Run from the project root:  python auth_fix.py
"""
import os, sys, json, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt
import jwt as pyjwt

# ── 1. Load env / DB ──────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

from backend.database.database import SessionLocal
from backend.models.user_model import User

TARGET_USERNAME = "admin"
TARGET_PASSWORD = "Admin@123"
TARGET_ROLE     = "Admin"

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkeyforlocaldev1234567890")
ALGORITHM  = os.getenv("ALGORITHM",  "HS256")

db = SessionLocal()

print("=" * 60)
print("  TRF Management — Auth Diagnostic & Fix Script")
print("=" * 60)

# ── 2. Check whether admin user exists ───────────────────────────────────────
user = db.query(User).filter(User.username == TARGET_USERNAME).first()

if user:
    print(f"\n[FOUND] User '{TARGET_USERNAME}' exists  (role={user.role})")
    # Verify the stored hash matches our target password
    try:
        pw_ok = bcrypt.checkpw(TARGET_PASSWORD.encode(), user.password.encode())
    except Exception as e:
        pw_ok = False
        print(f"  [WARN] bcrypt check error: {e}")

    if pw_ok:
        print(f"  [OK]  Password hash matches '{TARGET_PASSWORD}'")
    else:
        print(f"  [FIX] Password does NOT match — re-hashing to '{TARGET_PASSWORD}' ...")
        new_hash = bcrypt.hashpw(TARGET_PASSWORD.encode(), bcrypt.gensalt()).decode()
        user.password = new_hash
        db.commit()
        print(f"  [OK]  Password updated successfully.")

    # Fix role if wrong
    if user.role != TARGET_ROLE:
        print(f"  [FIX] Role is '{user.role}', correcting to '{TARGET_ROLE}' ...")
        user.role = TARGET_ROLE
        db.commit()
        print(f"  [OK]  Role corrected.")
    else:
        print(f"  [OK]  Role is already '{TARGET_ROLE}'")

else:
    print(f"\n[MISSING] User '{TARGET_USERNAME}' does NOT exist — creating ...")
    hashed = bcrypt.hashpw(TARGET_PASSWORD.encode(), bcrypt.gensalt()).decode()
    new_user = User(username=TARGET_USERNAME, password=hashed, role=TARGET_ROLE)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    user = new_user
    print(f"  [OK]  Admin account created  (id={user.id})")

db.close()

# ── 3. Verify bcrypt round-trip locally ───────────────────────────────────────
print("\n--- Local bcrypt verification ---")
db2 = SessionLocal()
fresh = db2.query(User).filter(User.username == TARGET_USERNAME).first()
pw_check = bcrypt.checkpw(TARGET_PASSWORD.encode(), fresh.password.encode())
print(f"  bcrypt.checkpw('{TARGET_PASSWORD}', stored_hash) => {pw_check}")
db2.close()

if not pw_check:
    print("  [ERROR] Password verification failed! Something is wrong with bcrypt.")
    sys.exit(1)

# ── 4. Test login via HTTP (if backend is running) ────────────────────────────
print("\n--- HTTP login test (requires backend running on :8000) ---")
API_URL = os.getenv("VITE_API_URL", "http://127.0.0.1:8000")
LOGIN_URL = f"{API_URL}/users/login"
payload_bytes = json.dumps({"username": TARGET_USERNAME, "password": TARGET_PASSWORD}).encode()

try:
    req = urllib.request.Request(
        LOGIN_URL,
        data=payload_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = json.loads(resp.read())
    token = body.get("token")
    print(f"  [OK]  HTTP 200 — Login successful!")
    print(f"        username : {body.get('username')}")
    print(f"        role     : {body.get('role')}")
    print(f"        token    : {token[:40]}..." if token else "        token: (none)")

    # Decode token locally to confirm claims
    decoded = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print(f"        sub claim: {decoded.get('sub')}")
    print(f"        role claim: {decoded.get('role')}")

except urllib.error.HTTPError as e:
    err_body = e.read().decode()
    print(f"  [FAIL] HTTP {e.code} from {LOGIN_URL}")
    print(f"         {err_body}")
    print("\n  NOTE: If the backend is not running, start it with 'python app.py'")
    print("        and re-run this script to confirm HTTP login works.")
except Exception as e:
    print(f"  [SKIP] Backend not reachable ({e})")
    print("         Start backend with 'python app.py', then re-run to confirm HTTP login.")

# ── 5. Summary ────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  CREDENTIALS CONFIRMED")
print("=" * 60)
print(f"  Username : {TARGET_USERNAME}")
print(f"  Password : {TARGET_PASSWORD}")
print(f"  Role     : {TARGET_ROLE}")
print(f"  bcrypt   : OK")
print("=" * 60)
