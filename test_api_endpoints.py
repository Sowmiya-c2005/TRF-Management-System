"""
Direct Python verification script for paginated backend route functions.
"""
import sys
sys.path.insert(0, ".")

from backend.database.database import SessionLocal
from backend.api import user_routes, notification_routes, audit_routes
from backend.models.user_model import User

def test_routes():
    print("=== Testing Backend Route Logic Directly ===")
    db = SessionLocal()
    try:
        # Find Admin user
        admin = db.query(User).filter(User.username == "admin").first()
        assert admin is not None, "Admin user not found in DB"
        print(f"Loaded Admin: {admin.username} ({admin.email})")

        # 1. Test list_users pagination
        res_users = user_routes.list_users(page=1, limit=5, db=db, _=admin)
        print("GET /users/ output:")
        print(f"  total={res_users['total']}, page={res_users['page']}, pages={res_users['pages']}, items={len(res_users['items'])}")
        assert "items" in res_users
        assert "total" in res_users

        # 2. Test get_my_notifications pagination
        res_notif = notification_routes.get_my_notifications(page=1, limit=5, db=db, current_user=admin)
        print("GET /notifications/ output:")
        print(f"  total={res_notif['total']}, page={res_notif['page']}, pages={res_notif['pages']}, items={len(res_notif['items'])}")
        assert "items" in res_notif
        assert "total" in res_notif

        # 3. Test get_audits pagination
        res_audits = audit_routes.get_audits(page=1, limit=5, db=db, current_user=admin)
        print("GET /audits/ output:")
        print(f"  total={res_audits['total']}, page={res_audits['page']}, pages={res_audits['pages']}, items={len(res_audits['items'])}")
        assert "items" in res_audits
        assert "total" in res_audits

        print("\n=== ALL DIRECT ROUTE FUNCTION CHECKS PASSED PERFECTLY ===")
    finally:
        db.close()

if __name__ == "__main__":
    test_routes()
