import smtplib
import os
from email.message import EmailMessage

SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASS = os.getenv('SMTP_PASS')
FROM_EMAIL = os.getenv('FROM_EMAIL', SMTP_USER)


def send_otp_email(to_email: str, otp: str):
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        # SMTP not configured; log and return
        print('SMTP not configured, skipping OTP email send')
        return False

    msg = EmailMessage()
    msg['Subject'] = 'Your Ailexity POS Admin Verification Code'
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg.set_content(f"Your Ailexity POS admin verification code is: {otp}\nThis code is valid for 15 minutes.")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        print('Failed to send OTP email:', e)
        return False
