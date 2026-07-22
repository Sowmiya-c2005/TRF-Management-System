"""Direct HTTP test of the login endpoint to isolate the exact failure."""
import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:8000"

def post_json(url, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body,
          headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as ex:
        return 0, str(ex)

print("=== Testing POST /users/login ===")
for uname, pw in [("admin","Admin@123"), ("engineer","Engineer@123"), ("manager","Manager@123")]:
    status, body = post_json(f"{BASE}/users/login", {"username": uname, "password": pw})
    if status == 200:
        print(f"  {uname}: OK  token={'...'+body.get('token','')[-10:]}  role={body.get('role')}")
    else:
        print(f"  {uname}: FAIL {status} -> {body}")
