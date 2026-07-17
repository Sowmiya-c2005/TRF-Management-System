# backend/test_dashboard_requests.py
import requests

def test_routes():
    # Attempt login as admin, manager, engineer
    # We will search the database or just try login
    base_url = "http://127.0.0.1:8000"
    
    # Try to find a user or login
    # Let's try standard credentials
    creds = {
        "admin": "Admin@123",
        "manager": "Manager@123",
        "engineer": "Engineer@123"
    }
    for role, password in creds.items():
        print(f"Logging in as {role}...")
        resp = requests.post(f"{base_url}/users/login", json={"username": role, "password": password})
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Test dashboard stats
            print(f"Testing {role} dashboard...")
            r = requests.get(f"{base_url}/dashboard/{role}", headers=headers)
            assert r.status_code == 200, f"Dashboard for {role} failed: {r.text}"
            print(f"{role} dashboard response: {r.json().keys()}")
            
            # Test legacy all-trfs
            print("Testing all-trfs...")
            r = requests.get(f"{base_url}/all-trfs", headers=headers)
            assert r.status_code == 200, f"all-trfs for {role} failed: {r.text}"
            print(f"all-trfs count: {len(r.json())}")
        else:
            print(f"Could not login as {role}: {resp.text}")

    print("\nAll live HTTP dashboard tests finished!")

if __name__ == "__main__":
    test_routes()
