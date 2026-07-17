"""
Assignment service - manage TRF assignments to managers and engineers.
"""
from datetime import datetime, timezone
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.trf_model import TRFRecord
from backend.models.user_model import User
from backend.models.trf_assignment_model import TRFEngineerAssignment
from backend.repositories.trf_repository import TRFRepository
from backend.repositories.user_repository import UserRepository
from backend.repositories.assignment_repository import AssignmentRepository
from backend.utils.logging_config import get_logger

logger = get_logger("assignment_service")

trf_repo = TRFRepository()
user_repo = UserRepository()
assignment_repo = AssignmentRepository()


def assign_trf(db: Session, trf_id: int, manager_id: int = None, engineer_ids: List[int] = None, assigned_by_id: int = None, priority: str = None, due_date = None, remarks: str = None) -> TRFRecord:
    """Assign a TRF to a manager and engineers, and set priority, due date, and remarks."""
    trf = trf_repo.get(db, trf_id)
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRF not found.")
    
    # Update project parameters if supplied
    if priority is not None:
        trf.priority = priority
    if due_date is not None:
        trf.due_date = due_date
    if remarks is not None:
        trf.remarks = remarks
    
    # Assign manager (if manager_id is explicitly passed)
    if manager_id is not None:
        if manager_id <= 0:
            trf.assigned_manager_id = None
            logger.info(f"Unassigned manager from TRF {trf.trf_number}")
        else:
            manager = user_repo.get(db, manager_id)
            if not manager:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager not found.")
            if manager.role != "Manager" and manager.role != "Admin":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User must be a Manager or Admin.")
            trf.assigned_manager_id = manager_id
            logger.info(f"Assigned manager {manager.username} to TRF {trf.trf_number}")
    
    # Assign engineers (if engineer_ids list is explicitly passed)
    if engineer_ids is not None:
        # Remove existing engineer assignments
        assignment_repo.delete_by_trf_id(db, trf_id)
        
        # Add new assignments
        for engineer_id in engineer_ids:
            engineer = user_repo.get(db, engineer_id)
            if not engineer:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Engineer with ID {engineer_id} not found.")
            if engineer.role != "Engineer" and engineer.role != "Admin":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {engineer.username} must be an Engineer or Admin.")
            
            assignment = TRFEngineerAssignment(
                trf_id=trf_id,
                engineer_id=engineer_id,
                assigned_by_id=assigned_by_id
            )
            db.add(assignment)
            logger.info(f"Assigned engineer {engineer.username} to TRF {trf.trf_number}")
    
    # Update status if assignments exist
    if trf.assigned_manager_id or (engineer_ids and len(engineer_ids) > 0):
        if trf.status == "Draft":
            trf.status = "Assigned"
            trf.status_updated_at = datetime.now(timezone.utc)
            logger.info(f"TRF {trf.trf_number} status updated to Assigned")
    
    trf.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trf)
    return trf


def get_trf_assignments(db: Session, trf_id: int) -> dict:
    """Get all assignments for a TRF."""
    trf = trf_repo.get(db, trf_id)
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRF not found.")
    
    assignments = assignment_repo.get_by_trf_id(db, trf_id)
    
    return {
        "trf_id": trf_id,
        "trf_number": trf.trf_number,
        "manager_id": trf.assigned_manager_id,
        "engineer_assignments": assignments
    }


def get_user_assigned_trfs(db: Session, user_id: int, user_role: str) -> List[TRFRecord]:
    """Get TRFs assigned to a user based on their role."""
    user = user_repo.get(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    if user_role == "Admin":
        # Admin sees all TRFs
        return trf_repo.get_all(db)
    elif user_role == "Manager":
        # Manager sees TRFs assigned to them
        return db.query(TRFRecord).filter(TRFRecord.assigned_manager_id == user_id).all()
    elif user_role == "Engineer":
        # Engineer sees TRFs they are assigned to
        assignments = assignment_repo.get_by_engineer_id(db, user_id)
        trf_ids = [a.trf_id for a in assignments]
        return db.query(TRFRecord).filter(TRFRecord.id.in_(trf_ids)).all()
    else:
        return []


def update_trf_status(db: Session, trf_id: int, new_status: str) -> TRFRecord:
    """Update TRF status with workflow validation."""
    valid_statuses = ["Draft", "Assigned", "In Progress", "Under Review", "Approved", "Completed", "Archived"]
    
    if new_status not in valid_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Must be one of {valid_statuses}")
    
    trf = trf_repo.get(db, trf_id)
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRF not found.")
    
    # Validate status transitions
    current_status = trf.status
    valid_transitions = {
        "Draft": ["Assigned", "Archived"],
        "Assigned": ["In Progress", "Archived"],
        "In Progress": ["Under Review", "Archived"],
        "Under Review": ["Approved", "In Progress", "Archived"],
        "Approved": ["Completed", "Under Review", "Archived"],
        "Completed": ["Archived"],
        "Archived": []
    }
    
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from {current_status} to {new_status}. Valid transitions: {valid_transitions[current_status]}"
        )
    
    old_status = trf.status
    trf.status = new_status
    trf.status_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trf)
    
    logger.info(f"TRF {trf.trf_number} status changed from {old_status} to {new_status}")
    return trf
