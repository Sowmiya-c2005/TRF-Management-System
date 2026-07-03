"""Fix admin password. Run: python fix_login.py"""
import sys; sys.path.insert(0, ".")
import bcrypt
from backend.database.database import SessionLocal
from backend.models.user_model import User
from sqlalchemy import text

db = SessionLocal()

# Reset admin password to admin123
pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
db.execute(text(f"UPDATE users SET password='{pw}' WHERE username='admin'"))
db.commit()

# Confirm
u = db.query(User).filter(User.username == "admin").first()
if u:
    ok = bcrypt.checkpw(b"admin123", u.password.encode())
    print(f"admin password reset — verify={ok}  role={u.role}")
else:
    print("admin user not found, creating...")
    u = User(username="admin", password=pw, role="Admin")
    db.add(u); db.commit()
    print("admin created with password=admin123")

db.close()
