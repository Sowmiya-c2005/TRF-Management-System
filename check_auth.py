import psycopg2
import bcrypt

conn = psycopg2.connect("postgresql://postgres:postgre123@localhost:5432/trf_management")
cur = conn.cursor()
cur.execute("SELECT username, email, password, role, is_active FROM users ORDER BY id")
rows = cur.fetchall()
cur.close()
conn.close()

test_creds = [
    ("admin",    "Admin@123"),
    ("engineer", "Engineer@123"),
    ("manager",  "Manager@123"),
]

print("=== Password verification test ===")
for uname, pw in test_creds:
    user = next((r for r in rows if r[0] == uname), None)
    if not user:
        print(f"  {uname}: USER NOT FOUND IN DB")
        continue
    username, email, stored_hash, role, is_active = user
    try:
        ok = bcrypt.checkpw(pw.encode("utf-8"), stored_hash.encode("utf-8"))
    except Exception as e:
        ok = False
        print(f"  {uname}: bcrypt ERROR -> {e}")
        continue
    print(f"  {uname} / {pw} -> verify={ok}  role={role}  is_active={is_active}  email={email!r}")

print()
print("=== Email lookup test (what authenticate_user does first) ===")
# simulate: get_by_email(db, "admin".strip().lower())
# would look for email == "admin" — won't match "admin@trf.com"
for uname, _ in test_creds:
    email_match = next((r for r in rows if r[1] == uname.strip().lower()), None)
    username_match = next((r for r in rows if r[0] == uname), None)
    print(f"  Input '{uname}': email_lookup={'FOUND -> '+email_match[0] if email_match else 'NOT FOUND'}  username_lookup={'FOUND' if username_match else 'NOT FOUND'}")
