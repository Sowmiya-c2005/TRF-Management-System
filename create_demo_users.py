"""
Create one demo user per role.
Run: python create_demo_users.py

NOTE:
  - Login passwords are APPLICATION passwords, completely independent from SMTP credentials.
  - SMTP_USER / SMTP_PASSWORD in .env are only used for sending email via Gmail SMTP.
  - Never use the Gmail App Password as a login password.
"""
import sys; sys.path.insert(0, ".")
import bcrypt
from backend.database.database import SessionLocal
from backend.models.user_model import User

# ── Application login credentials ────────────────────────────────────────────
# These are the passwords users type in the login form.
# SMTP credentials are completely separate and must NOT be used here.
DEMO_USERS = [
    {
        "username":     "admin",
        "password":     "Admin@123",                  # Application login password
        "role":         "Admin",
        "email":        "sowmiya.novelx@gmail.com",   # Real email for notifications
        "display_name": "Admin User",
    },
    {
        "username":     "engineer",
        "password":     "Engineer@123",
        "role":         "Engineer",
        "email":        "engineer@trf.com",
        "display_name": "Site Engineer",
    },
    {
        "username":     "manager",
        "password":     "Manager@123",
        "role":         "Manager",
        "email":        "manager@trf.com",
        "display_name": "Project Manager",
    },
    {
        "username":     "viewer",
        "password":     "Viewer@123",
        "role":         "Viewer",
        "email":        "viewer@trf.com",
        "display_name": "Viewer User",
    },
]

db = SessionLocal()
created, updated = 0, 0

for d in DEMO_USERS:
    hashed = bcrypt.hashpw(d["password"].encode(), bcrypt.gensalt()).decode()
    existing = db.query(User).filter(User.username == d["username"]).first()
    if existing:
        existing.password     = hashed
        existing.role         = d["role"]
        existing.email        = d["email"]
        existing.display_name = d["display_name"]
        updated += 1
        print(f"  Updated : {d['username']} / {d['password']}  (email: {d['email']})  [{d['role']}]")
    else:
        u = User(
            username=d["username"],
            password=hashed,
            role=d["role"],
            email=d["email"],
            display_name=d["display_name"],
        )
        db.add(u)
        created += 1
        print(f"  Created : {d['username']} / {d['password']}  (email: {d['email']})  [{d['role']}]")

db.commit()
db.close()
print(f"\nDone -- {created} created, {updated} updated.")
print("\nAdmin login credentials:")
print("  Username : admin")
print("  Email    : sowmiya.novelx@gmail.com")
print("  Password : Admin@123  (application login password, NOT the Gmail App Password)")
