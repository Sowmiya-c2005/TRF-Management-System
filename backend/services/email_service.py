"""
Email notification service.
Reads SMTP settings fresh from os.environ each time so changes to .env
are picked up without restarting — and dotenv is re-loaded if needed.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from backend.utils.logging_config import get_logger

logger = get_logger("email_service")


def _cfg(db = None):
    """Return SMTP settings read live from environment, falling back to DB Admin email if user is empty."""
    smtp_user = (os.getenv("SMTP_USER", "") or "").strip()
    if not smtp_user and db:
        try:
            from backend.models.user_model import User
            admin = db.query(User).filter(User.role == "Admin", User.is_active == True).first()
            if admin and admin.email:
                smtp_user = admin.email.strip()
        except Exception as e:
            logger.warning(f"Failed to fetch admin email from DB for SMTP: {e}")

    smtp_from = (os.getenv("SMTP_FROM", "") or "").strip()
    if not smtp_from:
        smtp_from = smtp_user if smtp_user else "noreply@trfportal.com"

    # Gmail App Passwords are 16 chars — they may be stored with spaces in .env
    # (e.g. "klep gvfu kirf xynx"). Strip all whitespace so SMTP login works.
    raw_password = os.getenv("SMTP_PASSWORD", "") or ""
    smtp_password = raw_password.replace(" ", "").strip()

    cfg = {
        "host":     (os.getenv("SMTP_HOST", "") or "").strip(),
        "port":     int(os.getenv("SMTP_PORT", "587")),
        "user":     smtp_user,
        "password": smtp_password,
        "from":     smtp_from,
        "app_url":  (os.getenv("APP_BASE_URL", "http://localhost:5173") or "").strip(),
    }
    logger.debug(
        f"[SMTP-CFG] host={cfg['host']!r} port={cfg['port']} "
        f"user={cfg['user']!r} password_len={len(cfg['password'])} "
        f"from={cfg['from']!r}"
    )
    return cfg


def _ready(c: dict) -> bool:
    return bool(c["host"] and c["user"] and c["password"])


# ── Core sender ────────────────────────────────────────────────────────────────

def send_system_email(to_email: str, subject: str, body_text: str, db = None) -> bool:
    """
    Send a professional HTML email.
    Returns True on success, False on failure or when SMTP is not configured.
    """
    c = _cfg(db)
    if not _ready(c):
        logger.warning(
            f"Email NOT sent — SMTP not configured in .env "
            f"(SMTP_HOST={c['host']!r}, SMTP_USER={c['user']!r}). "
            f"Skipping: to={to_email!r}, subject={subject!r}"
        )
        return False

    import threading

    def target():
        logger.info(f"[SMTP-DEBUG] Starting background system email thread to: {to_email}")
        try:
            msg            = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"]    = f"TRF Portal <{c['from']}>"
            msg["To"]      = to_email

            # Plain text
            msg.attach(MIMEText(body_text, "plain"))

            # HTML — professional enterprise template
            rows = "".join(
                f"<tr><td style='padding:5px 0;color:#334155;line-height:1.7'>{ln}</td></tr>"
                for ln in body_text.split("\n")
            )
            html = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;
                    border:1px solid #e2e8f0;
                    box-shadow:0 4px 24px rgba(0,0,0,0.07)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#06b6d4);
                     border-radius:16px 16px 0 0;padding:24px 32px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:44px;height:44px;background:rgba(255,255,255,0.2);
                           border-radius:10px;text-align:center;vertical-align:middle;
                           font-size:22px;padding:4px">📋</td>
                <td style="padding-left:14px">
                  <div style="color:#ffffff;font-weight:700;font-size:16px">TRF Portal</div>
                  <div style="color:rgba(255,255,255,0.75);font-size:11px;
                               letter-spacing:1.5px;text-transform:uppercase">Enterprise Edition</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Subject -->
        <tr>
          <td style="padding:28px 32px 8px">
            <h2 style="margin:0;color:#1e293b;font-size:18px;font-weight:700">{subject}</h2>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:8px 32px 24px">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#f8fafc;border-radius:10px;
                          border:1px solid #e2e8f0;padding:16px">
              {rows}
            </table>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 28px">
            <a href="{c['app_url']}"
               style="display:inline-block;padding:12px 28px;
                      background:linear-gradient(135deg,#6366f1,#06b6d4);
                      color:#ffffff;border-radius:10px;text-decoration:none;
                      font-weight:600;font-size:14px">
              Open TRF Portal →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #e2e8f0;padding:16px 32px">
            <p style="margin:0;color:#94a3b8;font-size:11px">
              TRF Management System · Enterprise Edition ·
              This is an automated notification — please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

            msg.attach(MIMEText(html, "html"))

            logger.info(f"[SMTP-DEBUG] Connecting to SMTP server {c['host']}:{c['port']}...")
            with smtplib.SMTP(c["host"], c["port"], timeout=15) as srv:
                logger.info("[SMTP-DEBUG] Connection established. Sending EHLO...")
                srv.ehlo()
                logger.info("[SMTP-DEBUG] Upgrading to secure TLS connection...")
                srv.starttls()
                logger.info("[SMTP-DEBUG] Sending post-TLS EHLO...")
                srv.ehlo()
                logger.info(f"[SMTP-DEBUG] Attempting SMTP login for user: {c['user']}...")
                srv.login(c["user"], c["password"])
                logger.info("[SMTP-DEBUG] SMTP authentication successful. Dispatching email...")
                srv.sendmail(c["from"], to_email, msg.as_string())

            logger.info(f"✅ Email sent successfully to recipient → {to_email!r}: {subject!r}")
        except smtplib.SMTPAuthenticationError as auth_err:
            logger.error(
                f"❌ SMTP Auth failed for {c['user']!r}: {auth_err}. "
                f"If using Gmail, ensure 2FA is ON and you are using an App Password. "
                f"Current password length: {len(c['password'])}"
            )
        except Exception as exc:
            logger.error(f"❌ Email failed → {to_email!r}: {type(exc).__name__}: {exc}")

    threading.Thread(target=target, daemon=True).start()
    return True


# ── Admin notifier — fetches admin emails LIVE from DB ────────────────────────

def notify_admins(db, subject: str, body: str) -> None:
    """
    Query ALL active Admin emails from DB and send.
    If admin changes email → next notification goes to new email automatically.
    """
    try:
        from backend.models.user_model import User
        admins = (
            db.query(User)
            .filter(User.role == "Admin", User.is_active == True)
            .all()
        )
        if not admins:
            logger.warning("notify_admins: no active Admin users found in DB.")
            return

        sent = 0
        for admin in admins:
            if admin.email and admin.email.strip():
                ok = send_system_email(admin.email.strip(), subject, body, db)
                if ok:
                    sent += 1
            else:
                logger.warning(
                    f"notify_admins: Admin '{admin.username}' has no email — skipping."
                )
        logger.info(f"notify_admins: sent {sent}/{len(admins)} emails for '{subject}'")

    except Exception as e:
        logger.error(f"notify_admins error: {type(e).__name__}: {e}")


# ── Action-specific email builders ────────────────────────────────────────────

def send_admin_action_notification(
    db,
    trf_number: str,
    action_name: str,
    details: str,
    actor_name: str,
    actor_role: str,
    previous_status: Optional[str] = None,
    new_status: Optional[str] = None
) -> None:
    """
    Formulate and send a professional HTML email notification to all active Admins.
    Triggered for actions performed by Manager or Engineer roles only.
    Admin actions are recorded in audit logs but do NOT generate self-notification emails.
    """
    # —— ADMIN SELF-NOTIFICATION GUARD ——
    # Admin actions are audited but never generate self-notification emails.
    if actor_role == "Admin":
        logger.info(f"[EMAIL-SKIP] Admin action '{action_name}' by '{actor_name}' — skipping self-notification (audit log records this action).")
        return

    logger.info(f"[SMTP-DEBUG] Triggering admin action notification for action '{action_name}' by '{actor_name}' ({actor_role})")

    from datetime import datetime
    from backend.models.user_model import User as UserModel
    from backend.models.trf_model import TRFRecord

    try:
        # 1. Fetch actor info from database
        actor = db.query(UserModel).filter(UserModel.username == actor_name).first()
        actor_email = actor.email if actor else "Unknown Email"
        actor_display = actor.display_name if (actor and actor.display_name) else actor_name

        # 2. Fetch TRF info from database
        trf = db.query(TRFRecord).filter(TRFRecord.trf_number == trf_number).first()
        project_name = trf.project_name if trf else "Unknown Project"
        current_status = trf.status if trf else "Draft"
        date_time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 3. Resolve Assigned Manager and Engineer(s)
        manager_name = "Unassigned"
        if trf and trf.assigned_manager_id:
            mgr = db.query(UserModel).filter(UserModel.id == trf.assigned_manager_id).first()
            if mgr:
                manager_name = mgr.display_name or mgr.username

        engineer_names = []
        if trf:
            for ea in trf.engineer_assignments:
                eng = db.query(UserModel).filter(UserModel.id == ea.engineer_id).first()
                if eng:
                    engineer_names.append(eng.display_name or eng.username)
        engineers_str = ", ".join(engineer_names) if engineer_names else "Unassigned"

        # 4. Handle Status Transitions
        prev_st = previous_status or current_status
        new_st = new_status or current_status
        status_flow_str = f"{prev_st} &rarr; {new_st}" if prev_st != new_st else current_status

        # 5. Formulate Subject
        subject = f"[TRF Portal Alert] Action by {actor_role}: {action_name} ({trf_number})"

        c = _cfg(db)
        if not _ready(c):
            logger.warning(
                f"Email NOT configured. Skipping action notification for: {subject}"
            )
            return

        trf_link = f"{c['app_url']}/files?trf={trf_number}"

        # 6. Build Professional HTML email
        html_content = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background-color:#f1f5f9">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;
                    border:1px solid #e2e8f0;
                    box-shadow:0 10px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#06b6d4);
                     border-radius:16px 16px 0 0;padding:24px 32px">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width:40px;height:40px;background:rgba(255,255,255,0.2);
                           border-radius:8px;text-align:center;vertical-align:middle;
                           font-size:20px;padding:2px">🔔</td>
                <td style="padding-left:14px">
                  <div style="color:#ffffff;font-weight:700;font-size:16px">TRF Portal Action Alert</div>
                  <div style="color:rgba(255,255,255,0.8);font-size:11px;
                              letter-spacing:1px;text-transform:uppercase">Security Notification</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.5">
              An action has been performed by a <strong>{actor_role}</strong>. Below are the details:
            </p>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
              <!-- Actor Details -->
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;width:170px;font-weight:600">User Name</td>
                <td style="padding:10px 0;color:#1e293b;font-size:14px;font-weight:700">{actor_display}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">User Role</td>
                <td style="padding:10px 0;font-size:13px">
                  <span style="background:#e0e7ff;color:#6366f1;padding:2px 8px;border-radius:4px;font-weight:700;font-size:11px">{actor_role}</span>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">User Email</td>
                <td style="padding:10px 0;color:#1e293b;font-size:13px">{actor_email}</td>
              </tr>
              <!-- TRF/Project Details -->
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">TRF Number</td>
                <td style="padding:10px 0;color:#1e293b;font-size:14px;font-weight:700">{trf_number}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Project Name</td>
                <td style="padding:10px 0;color:#1e293b;font-size:13px">{project_name}</td>
              </tr>
              <!-- Action Details -->
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Action Performed</td>
                <td style="padding:10px 0;color:#b91c1c;font-size:14px;font-weight:700">{action_name}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Details</td>
                <td style="padding:10px 0;color:#475569;font-size:13px;font-style:italic">{details}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Previous Status &rarr; New Status</td>
                <td style="padding:10px 0;font-size:13px">
                  <span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:4px;font-weight:700;font-size:11px">{status_flow_str}</span>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Date & Time</td>
                <td style="padding:10px 0;color:#1e293b;font-size:13px">{date_time_str}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Assigned Manager</td>
                <td style="padding:10px 0;color:#1e293b;font-size:13px">{manager_name}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Assigned Engineer(s)</td>
                <td style="padding:10px 0;color:#1e293b;font-size:13px">{engineers_str}</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 32px">
            <a href="{trf_link}"
               style="display:inline-block;padding:12px 28px;
                      background:linear-gradient(135deg,#6366f1,#06b6d4);
                      color:#ffffff;border-radius:10px;text-decoration:none;
                      font-weight:600;font-size:13px">
              View TRF in Portal →
            </a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #e2e8f0;padding:20px 32px;background:#f8fafc;border-radius:0 0 16px 16px">
            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5">
              TRF Management Portal · Enterprise Security & Audit System.<br/>
              This is a system-generated alert sent to authorized Admin accounts.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""

        # 7. Fetch all active Admin emails (synchronously, in caller's thread)
        admin_emails = [admin.email.strip() for admin in db.query(UserModel).filter(UserModel.role == "Admin", UserModel.is_active == True).all() if admin.email and admin.email.strip()]

        import threading

        def bg_target():
            logger.info(f"[SMTP-DEBUG] Starting background SMTP admin notification thread for TRF={trf_number}, action={action_name}")
            logger.info(f"[SMTP-DEBUG] Active admin recipient email(s) resolved from DB: {admin_emails}")
            if not admin_emails:
                logger.info("[SMTP-DEBUG] No active Admin users with emails found in DB. Skipping.")
                return
            
            logger.info(f"[SMTP-DEBUG] Configuring SMTP connection. Host: {c['host']}, Port: {c['port']}, User: {c['user']}")
            try:
                # Connect and login once
                with smtplib.SMTP(c["host"], c["port"], timeout=15) as srv:
                    logger.info("[SMTP-DEBUG] SMTP socket connection opened. Sending EHLO...")
                    srv.ehlo()
                    logger.info("[SMTP-DEBUG] Upgrading connection to TLS (STARTTLS)...")
                    srv.starttls()
                    logger.info("[SMTP-DEBUG] Sending EHLO after STARTTLS...")
                    srv.ehlo()
                    logger.info(f"[SMTP-DEBUG] Attempting SMTP login for user: {c['user']}...")
                    srv.login(c["user"], c["password"])
                    logger.info("[SMTP-DEBUG] SMTP authentication successful!")

                    for email in admin_emails:
                        logger.info(f"[SMTP-DEBUG] Formulating MIME message for recipient: {email}")
                        try:
                            msg = MIMEMultipart("alternative")
                            msg["Subject"] = subject
                            msg["From"] = f"TRF Portal Security <{c['from']}>"
                            msg["To"] = email

                            plain_body = (
                                f"Action: {action_name}\n"
                                f"Actor: {actor_display} ({actor_role})\n"
                                f"Email: {actor_email}\n"
                                f"TRF: {trf_number}\n"
                                f"Project: {project_name}\n"
                                f"Time: {date_time_str}\n"
                                f"Status Transition: {status_flow_str}\n"
                                f"Manager: {manager_name}\n"
                                f"Engineers: {engineers_str}\n"
                                f"Link: {trf_link}\n"
                                f"Details: {details}"
                            )
                            msg.attach(MIMEText(plain_body, "plain"))
                            msg.attach(MIMEText(html_content, "html"))

                            logger.info(f"[SMTP-DEBUG] Sending email to {email}...")
                            srv.sendmail(c["from"], email, msg.as_string())
                            logger.info(f"✅ Email sent in background thread to Admin → {email!r}: {subject!r}")
                        except Exception as e:
                            logger.error(f"[SMTP-DEBUG] Failed to send admin alert to {email!r}: {e}")
            except smtplib.SMTPAuthenticationError as auth_err:
                logger.error(f"❌ SMTP Auth failed for {c['user']!r}: {auth_err}")
            except Exception as outer_err:
                logger.error(f"❌ Background admin notifications SMTP connection/login failed: {outer_err}")

        threading.Thread(target=bg_target, daemon=True).start()

    except Exception as e:
        logger.error(f"send_admin_action_notification error: {type(e).__name__}: {e}")


def email_trf_created(db, trf_number: str, project_name: str,
                      actor_name: str, actor_role: str) -> None:
    send_admin_action_notification(
        db, trf_number, "TRF Creation", f"Created TRF project '{project_name}'", actor_name, actor_role
    )


def email_trf_updated(db, trf_number: str, old_name: str, new_name: str,
                      actor_name: str, actor_role: str) -> None:
    send_admin_action_notification(
        db, trf_number, "TRF Project Update", f"Changed Project Name from '{old_name}' to '{new_name}'", actor_name, actor_role
    )


def email_file_uploaded(db, trf_number: str, folder_name: str,
                        filename: str, actor_name: str, actor_role: str) -> None:
    send_admin_action_notification(
        db, trf_number, "File Upload", f"Uploaded file '{filename}' to folder '{folder_name}'", actor_name, actor_role
    )


def email_file_deleted(db, trf_number: str, folder_name: str,
                       filename: str, actor_name: str, actor_role: str) -> None:
    send_admin_action_notification(
        db, trf_number, "File Deletion", f"Deleted file '{filename}' from folder '{folder_name}'", actor_name, actor_role
    )


def email_status_changed(db, trf_number: str, old_status: str,
                         new_status: str, actor_name: str, actor_role: str) -> None:
    send_admin_action_notification(
        db, trf_number, "Status Update", f"Changed status from '{old_status}' to '{new_status}'", actor_name, actor_role,
        previous_status=old_status, new_status=new_status
    )


def email_comment_added(db, trf_number: str, comment_text: str,
                        actor_name: str, actor_role: str) -> None:
    send_admin_action_notification(
        db, trf_number, "Comment Added", comment_text, actor_name, actor_role
    )


def email_file_replaced(db, trf_number: str, folder_name: str,
                        filename: str, actor_name: str, actor_role: str) -> None:
    """Notify admins when a Manager or Engineer replaces/versions a file."""
    send_admin_action_notification(
        db, trf_number, "File Replaced",
        f"Replaced file '{filename}' in folder '{folder_name}' with a new version",
        actor_name, actor_role
    )


def email_comment_updated(db, trf_number: str, comment_preview: str,
                          actor_name: str, actor_role: str) -> None:
    """Notify admins when a Manager or Engineer edits a comment."""
    send_admin_action_notification(
        db, trf_number, "Comment Updated",
        f"Edited a comment: \"{comment_preview[:200]}\"",
        actor_name, actor_role
    )


def email_comment_deleted(db, trf_number: str,
                          actor_name: str, actor_role: str) -> None:
    """Notify admins when a Manager or Engineer deletes a comment."""
    send_admin_action_notification(
        db, trf_number, "Comment Deleted",
        "A comment was deleted from this TRF",
        actor_name, actor_role
    )


def email_project_assigned(db, trf_number: str, manager_id: Optional[int],
                           engineer_ids: Optional[list[int]], actor_name: str, actor_role: str) -> None:
    """Notify admins when a project assignment is updated."""
    from backend.models.user_model import User as UserModel
    mgr_name = "Unassigned"
    if manager_id and manager_id > 0:
        mgr = db.query(UserModel).filter(UserModel.id == manager_id).first()
        if mgr:
            mgr_name = mgr.display_name or mgr.username

    eng_names = []
    if engineer_ids:
        for eid in engineer_ids:
            eng = db.query(UserModel).filter(UserModel.id == eid).first()
            if eng:
                eng_names.append(eng.display_name or eng.username)
    eng_str = ", ".join(eng_names) if eng_names else "Unassigned"

    details = f"Assigned Manager: {mgr_name}\nAssigned Engineer(s): {eng_str}"
    send_admin_action_notification(
        db, trf_number, "Project Assignment", details, actor_name, actor_role
    )


def send_user_action_notification(
    db,
    actor_name: str,
    actor_role: str,
    actor_email: str,
    action: str,
    details: str,
    trf_number: Optional[str] = None,
    notify_user_email: Optional[str] = None,
) -> None:
    """
    Send a notification to all active Admins for non-TRF user actions
    (login, password change, profile update, user creation, password reset, etc.).

    - If actor_role == "Admin": skip admin self-notification (Admin actions are audit-logged).
    - If notify_user_email is provided: also send an email to that address (e.g., new account welcome, password reset).
    """
    # Admin self-notification guard
    if actor_role == "Admin" and not notify_user_email:
        logger.info(f"[EMAIL-SKIP] Admin action '{action}' — skipping self-notification.")
        return

    from datetime import datetime
    from backend.models.user_model import User as UserModel

    date_time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    trf_str = trf_number or "N/A"
    c = _cfg(db)

    if not _ready(c):
        logger.warning(f"[EMAIL-SKIP] SMTP not configured — skipping notification for '{action}'.")
        return

    subject_admin = f"[TRF Portal] {actor_role} Action: {action}"
    subject_user  = f"[TRF Portal] {action} — Account Notification"

    def _build_html(headline: str) -> str:
        return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background-color:#f1f5f9">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;
                    border:1px solid #e2e8f0;
                    box-shadow:0 10px 25px -5px rgba(0,0,0,0.1)">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#06b6d4);
                     border-radius:16px 16px 0 0;padding:24px 32px">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width:40px;height:40px;background:rgba(255,255,255,0.2);
                           border-radius:8px;text-align:center;vertical-align:middle;
                           font-size:20px;padding:2px">🔔</td>
                <td style="padding-left:14px">
                  <div style="color:#ffffff;font-weight:700;font-size:16px">TRF Portal Notification</div>
                  <div style="color:rgba(255,255,255,0.8);font-size:11px;
                              letter-spacing:1px;text-transform:uppercase">Enterprise Edition</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.5">{headline}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px">
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;width:150px;font-weight:600">User Name</td>
                <td style="padding:10px 0;color:#1e293b;font-size:14px;font-weight:700">{actor_name}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">User Role</td>
                <td style="padding:10px 0;font-size:13px">
                  <span style="background:#e0e7ff;color:#6366f1;padding:2px 8px;border-radius:4px;font-weight:700;font-size:11px">{actor_role}</span>
                </td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">User Email</td>
                <td style="padding:10px 0;color:#1e293b;font-size:13px">{actor_email or "—"}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Action</td>
                <td style="padding:10px 0;color:#b91c1c;font-size:14px;font-weight:700">{action}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Details</td>
                <td style="padding:10px 0;color:#475569;font-size:13px;font-style:italic">{details}</td>
              </tr>
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">TRF Number</td>
                <td style="padding:10px 0;color:#1e293b;font-size:13px">{trf_str}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;color:#64748b;font-size:13px;font-weight:600">Date &amp; Time</td>
                <td style="padding:10px 0;color:#1e293b;font-size:13px">{date_time_str}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px">
            <a href="{c['app_url']}"
               style="display:inline-block;padding:12px 28px;
                      background:linear-gradient(135deg,#6366f1,#06b6d4);
                      color:#ffffff;border-radius:10px;text-decoration:none;
                      font-weight:600;font-size:13px">
              Open TRF Portal →
            </a>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #e2e8f0;padding:20px 32px;background:#f8fafc;border-radius:0 0 16px 16px">
            <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.5">
              TRF Management Portal · Enterprise Edition.<br/>
              This is an automated notification — please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    import threading

    def bg():
        from backend.database.database import SessionLocal
        bg_db = SessionLocal()
        try:
            recipients = []

            # Notify all active Admins (skip if actor is Admin themselves)
            if actor_role != "Admin":
                try:
                    admin_emails = [
                        a.email.strip()
                        for a in bg_db.query(UserModel).filter(
                            UserModel.role == "Admin", UserModel.is_active == True
                        ).all()
                        if a.email and a.email.strip()
                    ]
                except Exception:
                    admin_emails = []
                for ae in admin_emails:
                    recipients.append((ae, subject_admin, _build_html(
                        f"A <strong>{actor_role}</strong> has performed the following action:"
                    )))

            # Also notify the user themselves (e.g., new account, password reset)
            if notify_user_email and notify_user_email.strip():
                recipients.append((notify_user_email.strip(), subject_user, _build_html(
                    "The following action has been performed on your TRF Portal account:"
                )))

            if not recipients:
                logger.info("[EMAIL-SKIP] No recipients for user action notification.")
                return

            plain = (
                f"Action: {action}\nUser: {actor_name} ({actor_role})\n"
                f"Email: {actor_email}\nDetails: {details}\n"
                f"TRF: {trf_str}\nTime: {date_time_str}"
            )

            with smtplib.SMTP(c["host"], c["port"], timeout=15) as srv:
                srv.ehlo()
                srv.starttls()
                srv.ehlo()
                srv.login(c["user"], c["password"])
                for to_email, subj, html_body in recipients:
                    msg = MIMEMultipart("alternative")
                    msg["Subject"] = subj
                    msg["From"]    = f"TRF Portal <{c['from']}>"
                    msg["To"]      = to_email
                    msg.attach(MIMEText(plain, "plain"))
                    msg.attach(MIMEText(html_body, "html"))
                    srv.sendmail(c["from"], to_email, msg.as_string())
                    logger.info(f"✅ User action email sent to {to_email!r}: {subj!r}")
        except smtplib.SMTPAuthenticationError as auth_err:
            logger.error(f"❌ SMTP Auth failed: {auth_err}")
        except Exception as exc:
            logger.error(f"❌ send_user_action_notification error: {type(exc).__name__}: {exc}")
        finally:
            bg_db.close()

    threading.Thread(target=bg, daemon=True).start()
