"""
Email notification service.
─────────────────────────────────────────────────────────────────────────────
Sends SMTP emails when SMTP_HOST / SMTP_USER / SMTP_PASSWORD are set in .env.
Silently skips (logs at DEBUG) when not configured — safe default for dev.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from backend.utils.logging_config import get_logger

logger = get_logger("email_service")

SMTP_HOST     = os.getenv("SMTP_HOST", "")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM", "noreply@trfportal.com")

_is_configured = all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD])


def send_system_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send a plain-text system email.
    Returns True on success, False on failure.
    Silently returns False (with DEBUG log) when SMTP is not configured.
    """
    if not _is_configured:
        logger.debug(f"Email skipped (SMTP not configured): to={to_email!r} subject={subject!r}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_FROM
        msg["To"]      = to_email

        # Plain text part
        msg.attach(MIMEText(body, "plain"))

        # HTML part (simple formatting)
        html_body = body.replace("\n", "<br>")
        html = f"""
        <html><body style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px">
          <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;
                      border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.06)">
            <h2 style="color:#6366f1;margin:0 0 16px">{subject}</h2>
            <div style="color:#475569;line-height:1.7">{html_body}</div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
            <p style="color:#94a3b8;font-size:12px;margin:0">TRF Management System · Enterprise Edition</p>
          </div>
        </body></html>
        """
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email!r}: {subject!r}")
        return True

    except Exception as exc:
        logger.warning(f"Email failed to {to_email!r}: {exc}")
        return False
