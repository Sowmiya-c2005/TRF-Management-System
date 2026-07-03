"""Full API verification — run with: python verify_api.py"""
import sys
sys.path.insert(0, ".")
import requests

BASE = "http://127.0.0.1:8000"
results = []

def check(label, method, url, **kwargs):
    try:
        r = getattr(requests, method)(BASE + url, timeout=5, **kwargs)
        ok = r.status_code < 400
        results.append((ok, label, r.status_code, r.text[:120] if not ok else ""))
        status = "OK  " if ok else "FAIL"
        print(f"  {status} [{r.status_code}]  {label}")
        return r
    except Exception as e:
        results.append((False, label, "ERR", str(e)))
        print(f"  FAIL [ERR]  {label}: {e}")
        return None

print("\n=== Backend API Health Check ===\n")

# Core
check("GET  /",                     "get",  "/")
check("GET  /all-trfs",             "get",  "/all-trfs")
check("GET  /dashboard-stats",      "get",  "/dashboard-stats")
check("GET  /search-trf/TRF-2026-003", "get", "/search-trf/TRF-2026-003")

# Files
check("GET  /files/TRF-2026-003/Documents",   "get", "/files/TRF-2026-003/Documents")
check("GET  /files/TRF-2026-101/Documents",   "get", "/files/TRF-2026-101/Documents")
check("GET  /files/TRF-2026-069/Documents",   "get", "/files/TRF-2026-069/Documents")

# New /trfs router
check("GET  /trfs/",                "get",  "/trfs/")
check("GET  /trfs/stats",           "get",  "/trfs/stats")
check("GET  /trfs/sharepoint-status", "get", "/trfs/sharepoint-status")
check("GET  /trfs/TRF-2026-003",    "get",  "/trfs/TRF-2026-003")

# Auth endpoints
check("POST /users/login (valid)",  "post", "/users/login",
      json={"username": "admin", "password": "admin123"})
check("POST /users/login (bad pw)", "post", "/users/login",
      json={"username": "admin", "password": "wrongpassword"})

# Notifications & audits (no-token lenient mode)
check("GET  /notifications/",       "get",  "/notifications/")
check("GET  /audits/",              "get",  "/audits/")

print()
passed = sum(1 for ok, _, _, _ in results if ok)
failed = [(label, code, msg) for ok, label, code, msg in results if not ok]
print(f"Result: {passed}/{len(results)} checks passed")

if failed:
    print("\nFailed:")
    for label, code, msg in failed:
        print(f"  [{code}] {label}  {msg}")
else:
    print("All checks passed!")
