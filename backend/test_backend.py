import sys
import os
from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi.datastructures import UploadFile
from io import BytesIO

# Ensure project root is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.database import SessionLocal
from backend.models.user_model import User
from backend.models.trf_model import TRFRecord
from backend.models.folder_model import Folder
from backend.models.file_model import FileRecord
from backend.models.audit_log_model import AuditLog
from backend.models.notification_model import Notification
from backend.schemas.trf_schema import TRFCreate
from backend.schemas.user_schema import UserCreate

from backend.services import user_service, trf_service, file_service, audit_service, notification_service
from backend.middleware.auth_middleware import get_current_user, RoleChecker


def run_tests():
    print("--------------------------------------------------")
    print("Starting Automated Integration Tests for Backend Upgrade")
    print("--------------------------------------------------")

    db: Session = SessionLocal()
    try:
        # 1. Clean up test data if left over from previous runs
        print("Cleaning up old test data...")
        test_username = "test_engineer"
        test_trf_num = "TRF-TEST-2026"
        
        trf = db.query(TRFRecord).filter(TRFRecord.trf_number == test_trf_num).first()
        if trf:
            db.delete(trf)
        user = db.query(User).filter(User.username == test_username).first()
        if user:
            db.delete(user)
        db.commit()

        # 2. Test User Registration
        print("Testing User Registration...")
        user_payload = UserCreate(username=test_username, password="securepassword123")
        user = user_service.register_user(db, user_payload)
        assert user.username == test_username
        assert user.role == "Engineer"  # Second user (since admin is already there)
        print(" -> Registration Successful")

        # 3. Test User Authentication
        print("Testing User Authentication & Password Hashing...")
        authenticated_user = user_service.authenticate_user(db, test_username, "securepassword123")
        assert authenticated_user.id == user.id
        print(" -> Authentication Successful")

        # 4. Test Token Generation
        print("Testing JWT Token Generation...")
        token = user_service.create_access_token({"sub": user.username, "role": user.role})
        assert token is not None
        assert isinstance(token, str)
        print(" -> Token Generation Successful")

        # 5. Test TRF CRUD
        print("Testing TRF Creation & Subfolder Automation...")
        trf_payload = TRFCreate(trf_number=test_trf_num, project_name="Test Enterprise Project")
        trf = trf_service.create_trf(db, trf_payload, current_user=user)
        assert trf.trf_number == test_trf_num
        assert trf.project_name == "Test Enterprise Project"

        # Verify that subfolders were created in the DB
        folders = db.query(Folder).filter(Folder.trf_id == trf.id).all()
        folder_names = [f.name for f in folders]
        print(f" -> Automated DB folders created: {folder_names}")
        for std_folder in trf_service.TRF_SUBFOLDERS:
            assert std_folder in folder_names

        # Verify physical directories
        for std_folder in trf_service.TRF_SUBFOLDERS:
            physical_path = os.path.join(trf_service.UPLOADS_ROOT, test_trf_num, std_folder)
            assert os.path.exists(physical_path)
        print(" -> TRF CRUD and Directory structures created successfully")

        # 6. Test File Upload Metadata & Storage
        print("Testing File Upload Storage & DB Metadata Sync...")
        file_content = b"This is a mock PDF report content for testing."
        mock_file = UploadFile(
            file=BytesIO(file_content),
            filename="test_report.pdf",
            size=len(file_content)
        )
        
        saved_filename = file_service.save_file(
            db=db,
            trf_number=test_trf_num,
            folder_name="Reports",
            file=mock_file,
            current_user=user
        )
        assert saved_filename == "test_report.pdf"

        # Check DB tracking
        db_file = file_service.file_repo.get_by_trf_folder_and_name(db, test_trf_num, "Reports", "test_report.pdf")
        assert db_file is not None
        assert db_file.size_bytes == len(file_content)
        assert db_file.sharepoint_id is not None
        print(f" -> File recorded in database with SharePoint ID: {db_file.sharepoint_id}")

        # Check physical disk
        assert os.path.exists(db_file.file_path)
        print(" -> Local storage path verified successfully")

        # 7. Test File Listing
        print("Testing file listing...")
        files = file_service.list_files(db, test_trf_num, "Reports")
        assert "test_report.pdf" in files
        print(" -> File listing matches database records")

        # 8. Test Audit Logs
        print("Testing Audit Log persistence...")
        logs = db.query(AuditLog).filter(AuditLog.user_id == user.id).all()
        actions = [log.action for log in logs]
        print(f" -> Logged actions: {actions}")
        assert "CREATE_TRF" in actions
        assert "UPLOAD_FILE" in actions
        print(" -> Audit Logging verified successfully")

        # 9. Test Notifications
        print("Testing Notification dispatching...")
        notifs = db.query(Notification).all()
        titles = [n.title for n in notifs]
        print(f" -> Dispatch notifications: {titles}")
        assert any("TRF Created" in t for t in titles)
        assert any("File Uploaded" in t for t in titles)
        print(" -> Notifications verified successfully")

        # 10. Clean up created file
        print("Cleaning up file and records...")
        file_service.remove_file(db, test_trf_num, "Reports", "test_report.pdf", current_user=user)
        db_file_after = file_service.file_repo.get_by_trf_folder_and_name(db, test_trf_num, "Reports", "test_report.pdf")
        assert db_file_after is None
        
        # Verify deletion audit log
        delete_log = db.query(AuditLog).filter(AuditLog.user_id == user.id, AuditLog.action == "DELETE_FILE").first()
        assert delete_log is not None
        print(" -> File clean-up and delete logging successful")

        # Clean up remaining DB records
        db.query(Folder).filter(Folder.trf_id == trf.id).delete()
        db.query(TRFRecord).filter(TRFRecord.id == trf.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()

        print("\nSUCCESS: All automated tests completed successfully with 0 errors!")
        print("--------------------------------------------------")

    except AssertionError as e:
        print(f"\nFAIL: Assertion failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\nFAIL: Test crashed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
