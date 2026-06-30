How to set it up in Supabase:

Go to Resend.com and create a free account.
Get your API Key.
In your Supabase Dashboard, go to Project Settings > Auth > SMTP Settings.
Enable Custom SMTP and fill in these details:
Sender Email: onboarding@resend.dev (or your own domain if you verify it).
Host: smtp.resend.com
Port: 465 (SSL) or 587 (TLS).
Username: resend
Password: Your Resend API Key
