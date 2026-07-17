import sys
sys.path.insert(0, ".")
from sqlalchemy.orm import Session
from backend.database.database import SessionLocal
from backend.models.user_model import User
from backend.models.trf_model import TRFRecord
from backend.services import dashboard_service, email_service, assignment_service, trf_service
from backend.schemas.trf_schema import TRFCreate
from datetime import datetime, timedelta

def test_flow():
    db = SessionLocal()
    try:
        print("=== RUNNING NOTIFICATIONS & STATS VERIFICATION ===")
        
        # 1. Fetch required roles
        admin = db.query(User).filter(User.role == "Admin").first()
        manager = db.query(User).filter(User.role == "Manager").first()
        engineer = db.query(User).filter(User.role == "Engineer").first()
        
        if not admin or not manager or not engineer:
            print("Missing Admin/Manager/Engineer in database. Run create_demo_users.py first.")
            return

        print(f"Loaded Admin: {admin.username}")
        print(f"Loaded Manager: {manager.username}")
        print(f"Loaded Engineer: {engineer.username}")

        # 2. Create a test TRF for verification
        trf_num = "TRF-2026-888"
        existing = db.query(TRFRecord).filter(TRFRecord.trf_number == trf_num).first()
        if existing:
            db.delete(existing)
            db.commit()
            
        print("Creating TRF...")
        payload = TRFCreate(trf_number=trf_num, project_name="Notification Verification Project")
        # Creating as Admin
        trf = trf_service.create_trf(db, payload, current_user=admin)
        
        # Assigning
        due = datetime.utcnow() + timedelta(days=7)
        trf = assignment_service.assign_trf(
            db=db,
            trf_id=trf.id,
            manager_id=manager.id,
            engineer_ids=[engineer.id],
            assigned_by_id=admin.id,
            priority="Critical",
            due_date=due,
            remarks="Alert test"
        )
        db.refresh(trf)

        # 3. Test email alert generation (simulate actions by Manager / Engineer)
        print("Triggering email_trf_created as Manager...")
        email_service.email_trf_created(db, trf_num, trf.project_name, manager.username, "Manager")
        
        print("Triggering email_file_uploaded as Engineer...")
        email_service.email_file_uploaded(db, trf_num, "Documents", "report.pdf", engineer.username, "Engineer")
        
        print("Triggering email_comment_added as Engineer...")
        email_service.email_comment_added(db, trf_num, "Hello this is a comment", engineer.username, "Engineer")
        
        print("Triggering email_status_changed as Manager...")
        email_service.email_status_changed(db, trf_num, "Assigned", "In Progress", manager.username, "Manager")

        print("OK: All action notification email builders executed successfully!")

        # 4. Verify Dashboard Statistics
        print("Verifying Manager dashboard stats...")
        mgr_stats = dashboard_service.get_manager_dashboard_stats(db, manager.id)
        assert mgr_stats["assigned_projects"] >= 1
        print(f"Manager stats count: {mgr_stats['assigned_projects']}")

        print("Verifying Engineer dashboard stats...")
        eng_stats = dashboard_service.get_engineer_dashboard_stats(db, engineer.id)
        assert eng_stats["my_assigned_trfs"] >= 1
        print(f"Engineer stats count: {eng_stats['my_assigned_trfs']}")

        # 5. Verify status distribution role filtering
        print("Verifying Manager status distribution...")
        mgr_dist = dashboard_service.get_status_distribution(db, manager_id=manager.id)
        # Find 'Assigned' count for manager
        assigned_count = next(item["count"] for item in mgr_dist if item["status"] == "Assigned")
        print(f"Manager 'Assigned' TRFs: {assigned_count}")
        assert assigned_count >= 1

        print("Verifying Engineer status distribution...")
        eng_dist = dashboard_service.get_status_distribution(db, engineer_id=engineer.id)
        eng_assigned_count = next(item["count"] for item in eng_dist if item["status"] == "Assigned")
        print(f"Engineer 'Assigned' TRFs: {eng_assigned_count}")
        assert eng_assigned_count >= 1

        # Cleanup
        db.delete(trf)
        db.commit()
        print("=== ALL CHECKS PASSED SUCCESSFULLY ===")
    except AssertionError as e:
        print(f"Assertion failed: {e}")
    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_flow()
