import psycopg2
conn = psycopg2.connect("postgresql://postgres:postgre123@localhost:5432/trf_management")
cur = conn.cursor()
cur.execute("SELECT id, username, email, role, is_active, password FROM users ORDER BY id")
rows = cur.fetchall()
print(f"Total users: {len(rows)}")
for r in rows:
    uid, uname, email, role, active, pw = r
    pw_type = "bcrypt" if pw and pw.startswith("$2") else "plain/other"
    print(f"  id={uid}  username={uname!r}  email={email!r}  role={role}  is_active={active}  pw_type={pw_type}")
cur.close()
conn.close()
