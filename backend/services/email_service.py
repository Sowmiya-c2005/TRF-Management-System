import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.utils.logging_config import get_logger

logger = get_logger("email_service")

# SMTP Configurations from environment
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", "system@trfportal.com")


def send_system_email(to_email: str, subject: str, body: str) -> bool:
    """
    Sends an email notification. Fallbacks to mock mode if SMTP settings are missing.
    """
    is_configured = all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD])

    if not is_configured:
        # Mock mode: Log message details
        logger.info(
            f"📧  [MOCK EMAIL SENT]\n"
            f"    From   : {SMTP_FROM}\n"
            f"    To     : {to_email}\n"
            f"    Subject: {subject}\n"
            f"    Body   : {body}"
        )
        return True

    try:
        # Create message container
        msg = MIMEMultipart()
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        
        # Attach message body
        msg.attach(MIMEText(body, "plain"))

        # Initialize SMTP connection
        port = int(SMTP_PORT)
        server = smtplib.SMTP(SMTP_HOST, port)
        server.starttls()  # Upgrade connection to secure encrypted TLS
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())
        server.quit()

        logger.info(f"Email successfully sent to {to_email} with subject '{subject}'")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False
