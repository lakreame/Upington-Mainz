# Enable SMTP AUTH in Microsoft 365

**✅ SUCCESS! Authenticated SMTP has been enabled!**

**Helpful Resource**: https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission

## Method 1: Exchange Admin Center (GUI) - Updated Path

1. **Go to Exchange Admin Center**:
   - Visit: https://admin.exchange.microsoft.com
   - Sign in with admin account

2. **Navigate to Recipients → Mailboxes**:
   - Go to "Recipients" → "Mailboxes"
   - Select: BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com
   - Click "Manage email apps settings"
   - Enable: "Authenticated SMTP"

3. **Alternative Path - Org Settings**:
   - Go to "Settings" → "Org settings" → "Modern authentication"
   - Enable SMTP AUTH for the organization
   - OR go to "Settings" → "Mail flow" → "Mail flow rules"

4. **If Authentication Policies Missing**:
   - Your tenant may not have this feature enabled
   - Use PowerShell method below instead
   - Or enable per-mailbox in Recipients section

## Method 1A: Microsoft 365 Admin Center (Alternative)

1. **Go to Microsoft 365 Admin Center**:
   - Visit: https://admin.microsoft.com
   - Sign in with admin account

2. **Navigate to Security & Compliance**:
   - Go to "Settings" → "Org settings" → "Security & privacy"
   - Look for "Modern authentication" or "Legacy authentication"
   - Enable SMTP authentication if available

3. **Azure AD Authentication Policies**:
   - Visit: https://aad.portal.azure.com
   - Go to "Azure Active Directory" → "Security" → "Authentication methods"
   - Or "Conditional Access" → "Legacy authentication"

## Method 2: PowerShell (Admin Required)

```powershell
# Connect to Exchange Online
Connect-ExchangeOnline

# Enable SMTP AUTH for specific user
Set-CASMailbox -Identity "BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com" -SmtpClientAuthenticationDisabled $false

# Or enable for entire organization
Set-TransportConfig -SmtpClientAuthenticationDisabled $false

# Verify settings
Get-CASMailbox -Identity "BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com" | Select SmtpClientAuthenticationDisabled
```

## Method 3: Create Authentication Policy

```powershell
# Create new authentication policy
New-AuthenticationPolicy -Name "SMTP-AUTH-Policy" -AllowBasicAuthSmtp

# Assign to user
Set-User -Identity "BrettanyaBrown@Upingtonmainzllc1.onmicrosoft.com" -AuthenticationPolicy "SMTP-AUTH-Policy"
```

## Security Considerations

- SMTP AUTH is less secure than modern authentication
- Consider using App Passwords with MFA instead
- Monitor for suspicious login attempts
- Regularly review authentication policies
