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


def _cfg():
    """Return SMTP settings read live from environment (loaded by dotenv at startup)."""
    return {
        "host":     os.getenv("SMTP_HOST",     ""),
        "port":     int(os.getenv("SMTP_PORT", "587")),
        "user":     os.getenv("SMTP_USER",     ""),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from":     os.getenv("SMTP_FROM",     os.getenv("SMTP_USER", "noreply@trfportal.com")),
        "app_url":  os.getenv("APP_BASE_URL",  "http://localhost:5173"),
    }


def _ready(c: dict) -> bool:
    return bool(c["host"] and c["user"] and c["password"])


# ── Core sender ────────────────────────────────────────────────────────────────

def send_system_email(to_email: str, subject: str, body_text: str) -> bool:
    """
    Send a professional HTML email.
    Returns True on success, False on failure or when SMTP is not configured.
    """
    c = _cfg()
    if not _ready(c):
        logger.warning(
            f"Email NOT sent — SMTP not configured in .env "
            f"(SMTP_HOST={c['host']!r}, SMTP_USER={c['user']!r}). "
            f"Skipping: to={to_email!r}, subject={subject!r}"
        )
        return False

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

        with smtplib.SMTP(c["host"], c["port"], timeout=15) as srv:
            srv.ehlo()
            srv.starttls()
            srv.ehlo()
            srv.login(c["user"], c["password"])
            srv.sendmail(c["from"], to_email, msg.as_string())

        logger.info(f"✅ Email sent → {to_email!r}: {subject!r}")
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error(
            f"❌ SMTP Auth failed for {c['user']!r}. "
            f"If using Gmail, ensure 2FA is ON and you are using an App Password "
            f"(not your regular password). Current password in .env: {c['password'][:4]}****"
        )
        return False
    except Exception as exc:
        logger.error(f"❌ Email failed → {to_email!r}: {type(exc).__name__}: {exc}")
        return False


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
                ok = send_system_email(admin.email.strip(), subject, body)
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

def email_trf_created(db, trf_number: str, project_name: str,
                      actor_name: str, actor_role: str) -> None:
    subject = f"[TRF Portal] New TRF Created: {trf_number}"
    body = (
        f"A new TRF has been created by {actor_role} '{actor_name}'.\n\n"
        f"TRF Number   : {trf_number}\n"
        f"Project Name : {project_name}\n"
        f"Created By   : {actor_name} ({actor_role})\n\n"
        f"Folders created: Documents, Reports, Drawings, Approvals, Final Submission.\n\n"
        f"Please log in to the TRF Portal to review."
    )
    notify_admins(db, subject, body)


def email_trf_updated(db, trf_number: str, old_name: str, new_name: str,
                      actor_name: str, actor_role: str) -> None:
    subject = f"[TRF Portal] TRF Updated: {trf_number}"
    body = (
        f"TRF '{trf_number}' has been updated by {actor_role} '{actor_name}'.\n\n"
        f"Previous Project Name : {old_name}\n"
        f"New Project Name      : {new_name}\n"
        f"Updated By            : {actor_name} ({actor_role})\n\n"
        f"Please log in to the TRF Portal for details."
    )
    notify_admins(db, subject, body)


def email_file_uploaded(db, trf_number: str, folder_name: str,
                        filename: str, actor_name: str, actor_role: str) -> None:
    subject = f"[TRF Portal] File Uploaded: {trf_number}"
    body = (
        f"A new file has been uploaded by {actor_role} '{actor_name}'.\n\n"
        f"TRF Number  : {trf_number}\n"
        f"Folder      : {folder_name}\n"
        f"File Name   : {filename}\n"
        f"Uploaded By : {actor_name} ({actor_role})\n\n"
        f"Please log in to the TRF Portal to review."
    )
    notify_admins(db, subject, body)


def email_file_deleted(db, trf_number: str, folder_name: str,
                       filename: str, actor_name: str, actor_role: str) -> None:
    subject = f"[TRF Portal] File Deleted: {trf_number}"
    body = (
        f"A file has been deleted by {actor_role} '{actor_name}'.\n\n"
        f"TRF Number  : {trf_number}\n"
        f"Folder      : {folder_name}\n"
        f"File Name   : {filename}\n"
        f"Deleted By  : {actor_name} ({actor_role})\n\n"
        f"Please log in to the TRF Portal for details."
    )
    notify_admins(db, subject, body)


def email_status_changed(db, trf_number: str, old_status: str,
                         new_status: str, actor_name: str, actor_role: str) -> None:
    subject = f"[TRF Portal] Status Changed: {trf_number}"
    body = (
        f"TRF '{trf_number}' status changed by {actor_role} '{actor_name}'.\n\n"
        f"Previous Status : {old_status}\n"
        f"New Status      : {new_status}\n"
        f"Changed By      : {actor_name} ({actor_role})\n\n"
        f"Please log in to the TRF Portal for details."
    )
    notify_admins(db, subject, body)


def email_comment_added(db, trf_number: str, comment_text: str,
                        actor_name: str, actor_role: str) -> None:
    subject = f"[TRF Portal] New Comment on {trf_number}"
    body = (
        f"{actor_role} '{actor_name}' added a comment on TRF '{trf_number}'.\n\n"
        f"Comment : {comment_text[:300]}{'...' if len(comment_text) > 300 else ''}\n\n"
        f"Please log in to the TRF Portal to view."
    )
    notify_admins(db, subject, body)
