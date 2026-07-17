# backend/test_dashboard_routes.py
import os
import sys
from fastapi.testclient import TestClient

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.database import get_db, SessionLocal
from backend.main import app
from backend.models.user_model import User
from backend.models.trf_model import TRFRecord

client = TestClient(app)

def test_routes():
    db = SessionLocal()
    try:
        # Get users for testing
        admin_user = db.query(User).filter(User.username == "admin").first()
        manager_user = db.query(User).filter(User.username == "manager").first() or db.query(User).filter(User.username == "manager1").first()
        engineer_user = db.query(User).filter(User.username == "engineer").first() or db.query(User).filter(User.username == "engineer1").first()
        
        print("Authenticating users...")
        
        # Helper to authenticate with common passwords
        def get_auth_headers(username):
            passwords = ["Admin@123", "admin123", "manager123", "engineer123", "password", "Manager@123", "Engineer@123"]
            for pw in passwords:
                resp = client.post("/users/login", json={"username": username, "password": pw})
                if resp.status_code == 200:
                    token = resp.json()["token"]
                    return {"Authorization": f"Bearer {token}"}
            return None
        
        # Test Admin Dashboard
        if admin_user:
            headers = get_auth_headers(admin_user.username)
            assert headers is not None, f"Failed to authenticate admin {admin_user.username}"
            
            print(f"Testing admin dashboard as {admin_user.username}...")
            r = client.get("/dashboard/admin", headers=headers)
            assert r.status_code == 200, f"Admin dashboard failed: {r.text}"
            print("Admin Dashboard: OK!")
            
            print("Testing legacy all-trfs...")
            r = client.get("/all-trfs", headers=headers)
            assert r.status_code == 200, f"Legacy all-trfs failed: {r.text}"
            print("Legacy All-TRFs: OK!")
        
        # Test Manager Dashboard
        if manager_user:
            headers = get_auth_headers(manager_user.username)
            assert headers is not None, f"Failed to authenticate manager {manager_user.username}"
            
            print(f"Testing manager dashboard as {manager_user.username}...")
            r = client.get("/dashboard/manager", headers=headers)
            assert r.status_code == 200, f"Manager dashboard failed: {r.text}"
            print("Manager Dashboard: OK!")
            
            print("Testing legacy all-trfs as manager...")
            r = client.get("/all-trfs", headers=headers)
            assert r.status_code == 200, f"Legacy all-trfs failed: {r.text}"
            print("Manager legacy all-trfs: OK!")

        # Test Engineer Dashboard
        if engineer_user:
            headers = get_auth_headers(engineer_user.username)
            assert headers is not None, f"Failed to authenticate engineer {engineer_user.username}"
            
            print(f"Testing engineer dashboard as {engineer_user.username}...")
            r = client.get("/dashboard/engineer", headers=headers)
            assert r.status_code == 200, f"Engineer dashboard failed: {r.text}"
            print("Engineer Dashboard: OK!")

        print("\nAll Dashboard tests passed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    test_routes()
