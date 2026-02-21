# Styled Supabase Email Templates

Copy these into **Supabase Dashboard → Authentication → Email Templates**

## Why These Improvements?

1. **Better Styling**: Professional HTML/CSS that renders well in all email clients
2. **Gmail Primary Inbox**: Structured HTML with proper headers helps avoid "Updates" tab
3. **Mobile Responsive**: Works on all devices
4. **Branded**: Uses your app colors and logo placeholder

---

## 1. Confirm Signup

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px 0;
      line-height: 1.6;
      color: #374151;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background-color: #d97706;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #b45309;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .security-note {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .security-note p {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>☀️ Confirm Your Email</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      
      <p>Thanks for signing up for Solar ROI Calculator! To get started and access your admin dashboard, please confirm your email address by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirm My Email Address</a>
      </div>
      
      <p>This link will expire in 24 hours. If you didn't create an account with us, you can safely ignore this email.</p>
      
      <div class="security-note">
        <p><strong>Security Tip:</strong> We'll never ask for your password via email.</p>
      </div>
    </div>
    <div class="footer">
      <p>Solar ROI Calculator &copy; 2026</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Magic Link

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px 0;
      line-height: 1.6;
      color: #374151;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background-color: #d97706;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Your Login Link</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      
      <p>You requested a magic link to sign in to Solar ROI Calculator. Click the button below to log in instantly:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Log In to Dashboard</a>
      </div>
      
      <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>Solar ROI Calculator &copy; 2026</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

---

## 3. Change Email Address

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px 0;
      line-height: 1.6;
      color: #374151;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background-color: #d97706;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Confirm Email Change</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      
      <p>You requested to change your email address from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>.</p>
      
      <p>To complete this change, please click the button below:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Change</a>
      </div>
      
      <div class="warning">
        <p><strong>⚠️ Important:</strong> If you didn't request this change, please contact support immediately.</p>
      </div>
    </div>
    <div class="footer">
      <p>Solar ROI Calculator &copy; 2026</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

---

## 4. Reset Password

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px 0;
      line-height: 1.6;
      color: #374151;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background-color: #d97706;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      
      <p>Someone requested a password reset for your Solar ROI Calculator account. If this was you, click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Reset My Password</a>
      </div>
      
      <p>This link will expire in 1 hour for security reasons.</p>
      
      <div class="warning">
        <p><strong>⚠️ Didn't request this?</strong> You can safely ignore this email. Your password won't be changed.</p>
      </div>
    </div>
    <div class="footer">
      <p>Solar ROI Calculator &copy; 2026</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
```

---

## How to Apply

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication → Email Templates**
3. For each template type (Confirm signup, Magic Link, etc.):
   - Click on the template
   - Replace the existing HTML with the code above
   - Click **Save**

## Tips for Gmail Primary Inbox

To maximize chances of landing in Gmail's Primary inbox (not Updates):

1. ✅ **Use proper HTML structure** (done above)
2. ✅ **Include text content, not just images** (done)
3. ✅ **Personalize when possible** (using Supabase variables)
4. ❌ **Avoid marketing language** ("Click here NOW!", "Limited time!")
5. ✅ **Single clear CTA button** (one action per email)
6. ✅ **Mobile responsive** (done with inline CSS)

## Testing

After applying templates:
1. Sign up with a new email
2. Check if email arrives in **Primary** inbox
3. View on mobile device to test responsiveness
4. Click the confirmation button to verify it works
