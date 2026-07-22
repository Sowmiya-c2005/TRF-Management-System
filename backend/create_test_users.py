"""
Create test users for development purposes.
Run this script to create default admin, manager, and engineer users with known passwords.

NOTE: All @trf.com addresses have been removed. Use real email addresses or valid
placeholders. In production, update Manager/Engineer emails via the User Management page.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend.database.database import engine, get_db
from backend.models.user_model import User
from backend.utils.logging_config import setup_logging, get_logger
import bcrypt

setup_logging()
logger = get_logger("create_test_users")

# Default test users — use real or placeholder emails (no @trf.com)
TEST_USERS = [
    {
        "username":     "admin",
        "email":        "sowmiya.novelx@gmail.com",   # Real admin email
        "display_name": "System Administrator",
        "role":         "Admin",
        "password":     "Admin@123"
    },
    {
        "username":     "manager1",
        "email":        "manager1@example.com",       # Replace with real email via User Management
        "display_name": "Project Manager",
        "role":         "Manager",
        "password":     "Manager@123"
    },
    {
        "username":     "engineer1",
        "email":        "engineer1@example.com",      # Replace with real email via User Management
        "display_name": "Senior Engineer",
        "role":         "Engineer",
        "password":     "Engineer@123"
    },
    {
        "username":     "engineer2",
        "email":        "engineer2@example.com",      # Replace with real email via User Management
        "display_name": "Junior Engineer",
        "role":         "Engineer",
        "password":     "Engineer@123"
    },
]

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_test_users():
    """Create test users in the database."""
    db = next(get_db())
    
    try:
        for user_data in TEST_USERS:
            # Check if user already exists
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            
            if existing_user:
                logger.info(f"User '{user_data['username']}' already exists. Skipping.")
                print(f"✓ User '{user_data['username']}' already exists.")
                continue
            
            # Create new user
            hashed_password = hash_password(user_data["password"])
            new_user = User(
                username=user_data["username"],
                email=user_data["email"],
                display_name=user_data["display_name"],
                role=user_data["role"],
                password=hashed_password,
                is_active=True
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            logger.info(f"Created user: {user_data['username']} (role: {user_data['role']})")
            print(f"✓ Created user: {user_data['username']} (role: {user_data['role']})")
        
        print("\n" + "="*60)
        print("TEST USERS CREATED SUCCESSFULLY")
        print("="*60)
        print("\nLogin credentials:")
        print("-" * 60)
        for user in TEST_USERS:
            print(f"  Email: {user['email']:<35} | Password: {user['password']:<15} | Role: {user['role']}")
        print("-" * 60)
        print("\nIMPORTANT: Update Manager/Engineer emails with real addresses via User Management!")
        print("="*60 + "\n")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating test users: {e}")
        print(f"\n❌ Error creating test users: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating test users for development...")
    create_test_users()
