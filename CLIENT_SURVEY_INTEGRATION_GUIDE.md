# Client Survey Integration Guide

## Overview

This guide explains how clients can integrate their existing surveys (Google Forms, SurveyMonkey, Typeform, Qualtrics, etc.) with the Binary & Beyond Survey Redirect System.

---

## Table of Contents

1. [How the System Works](#how-the-system-works)
2. [Client Responsibilities](#client-responsibilities)
3. [Platform-Specific Integration](#platform-specific-integration)
4. [Step-by-Step Workflow](#step-by-step-workflow)
5. [Testing Guide](#testing-guide)
6. [Troubleshooting](#troubleshooting)

---

## How the System Works

### The Three-Party Flow

```
┌─────────┐         ┌──────────────────┐         ┌─────────────────┐         ┌─────────┐
│ Vendor  │────────>│ Your Redirect    │────────>│ Client's Survey │────────>│ Vendor  │
│         │         │ System (Middleman)│         │ Platform        │         │         │
│ Sends   │         │ - Captures user  │         │ - Any platform  │         │ Gets    │
│ Traffic │         │ - Tracks session │         │ - Google Forms  │         │ Results │
└─────────┘         └──────────────────┘         │ - SurveyMonkey  │         └─────────┘
                                                  │ - Typeform      │
                                                  │ - Qualtrics     │
                                                  └─────────────────┘
```

### Key Points

1. **Your system is a middleman** - You don't host the actual survey
2. **Client hosts their survey** - On ANY platform they choose
3. **Client must configure redirect** - They need to send users back to your exit callback URL
4. **Your system handles routing** - You track which vendor sent which user and route them correctly

---

## Client Responsibilities

For the system to work, **the client MUST**:

### ✅ Required: Configure Exit Redirect

The client's survey platform MUST support **custom redirect URLs** after survey completion. This is the ONLY requirement.

**At the end of their survey, they must redirect respondents to:**

```
https://binaryandbeyondresearch.com/exit/{survey-slug}?status={STATUS}&tracking_id={TRACKING_ID}
```

**Where:**
- `{survey-slug}` = The Survey ID you provide (e.g., `colgate-2026`)
- `{STATUS}` = Status code (1=Complete, 2=Terminate, 3=Quota Full, 4=Security)
- `{TRACKING_ID}` = Tracking ID passed in the URL when they entered the survey

---

## Platform-Specific Integration

### ✅ Platforms That Support Custom Redirects

#### 1. **Typeform** (Recommended ⭐)
- ✅ Supports URL parameters (Hidden Fields)
- ✅ Supports custom redirect URL
- ✅ Easy to configure
- 💰 Free tier available

**Configuration:**
1. Add hidden fields: `tracking_id`, `return_url`
2. In "Endings" → Set "Redirect on completion" to: `@return_url?status=1&tracking_id=@tracking_id`

---

#### 2. **Qualtrics** (Recommended ⭐⭐⭐)
- ✅ Full support for URL parameters (Embedded Data)
- ✅ Custom redirect with logic
- ✅ Professional features
- 💰 Requires subscription

**Configuration:**
1. Survey Flow → Add Embedded Data: `tracking_id`, `return_url`
2. End of Survey → Set redirect to: `${e://Field/return_url}?status=1&tracking_id=${e://Field/tracking_id}`

---

#### 3. **SurveySparrow**
- ✅ Supports custom variables
- ✅ Custom redirect URL
- 💰 Free tier available

---

#### 4. **Alchemer (SurveyGizmo)**
- ✅ URL parameters supported
- ✅ Custom redirect logic

---

#### 5. **Lime Survey** (Self-Hosted)
- ✅ Full control over redirects
- ✅ Open source
- 🆓 Free (self-hosted)

---

### ❌ Platforms That DON'T Support Custom Redirects

These platforms **cannot be directly integrated** because they don't allow custom redirect URLs:

#### ❌ Google Forms
- No custom redirect
- No way to pass users back to your system
- **Workaround:** Use Google Apps Script (advanced)

#### ❌ SurveyMonkey (Free Tier)
- Custom redirect only on PAID plans
- Free tier shows SurveyMonkey thank you page

#### ❌ Microsoft Forms
- No custom redirect support
- Shows Microsoft thank you page only

---

## Step-by-Step Workflow

### For Binary & Beyond Admin:

**Step 1: Create Survey in Dashboard**
1. Go to Surveys → Create New Survey
2. Name: `Client Name - Project Name`
3. Copy the **Survey ID** (e.g., `colgate-2026`)

**Step 2: Configure Exit Callback URL**
1. Go to Configuration tab
2. Note the **Exit Callback URL**:
   ```
   https://binaryandbeyondresearch.com/exit/colgate-2026?status={STATUS}
   ```

**Step 3: Add Vendors**
1. Go to Vendors tab → Add Vendor
2. Configure vendor redirect URLs
3. Copy the **Entry URL** for each vendor

**Step 4: Share with Client**

Send the client an email with:

```
Subject: Survey Integration - Exit Callback Configuration

Hi [Client Name],

To integrate your survey with our redirect system, please configure your survey
platform to redirect respondents to the following URL after completion:

Exit Callback URL:
https://binaryandbeyondresearch.com/exit/colgate-2026?status=1&tracking_id={tracking_id}

Important:
- Replace {tracking_id} with the actual tracking_id parameter from the entry URL
- Use status=1 for complete, status=2 for terminate, etc.

The entry URL will automatically pass these parameters:
- tracking_id: Unique session identifier
- return_url: The full exit callback URL

Entry URL Format:
https://binaryandbeyondresearch.com/r/colgate-2026/{vendor-slug}?user_id={USER_ID}

Status Codes:
- status=1: Complete (qualified respondent)
- status=2: Terminate (not qualified)
- status=3: Quota Full
- status=4: Security Termination

Let me know if you need help configuring your survey platform.

Best regards,
Binary & Beyond Research Team
```

---

### For Client:

**Step 1: Create Survey on Their Platform**
- Use Typeform, Qualtrics, or any platform that supports custom redirects

**Step 2: Accept URL Parameters**

Configure the survey to capture URL parameters:
- `tracking_id` (required)
- `return_url` (required)
- `user_id` (optional)

**Step 3: Configure Exit Redirect**

At the end of the survey, redirect to:

**Complete:**
```
https://binaryandbeyondresearch.com/exit/colgate-2026?status=1&tracking_id={tracking_id}
```

**Terminate (if respondent doesn't qualify):**
```
https://binaryandbeyondresearch.com/exit/colgate-2026?status=2&tracking_id={tracking_id}
```

**Quota Full:**
```
https://binaryandbeyondresearch.com/exit/colgate-2026?status=3&tracking_id={tracking_id}
```

**Step 4: Add Logic (Optional)**

Use survey logic to determine which status to use:
- If qualified → status=1
- If screened out → status=2
- If quota met → status=3

**Step 5: Test**
- Use the test entry URL provided by Binary & Beyond
- Complete the survey
- Verify redirect works correctly

---

## Real-World Example: Typeform Integration

### Client Setup (Typeform)

**Step 1: Create Survey**
1. Go to Typeform → Create new form
2. Add survey questions

**Step 2: Add Hidden Fields**
1. Click "Variables" in the top menu
2. Add hidden fields:
   - `tracking_id`
   - `return_url`
   - `user_id` (optional)

**Step 3: Configure Redirect**
1. Go to "Endings" section
2. Enable "Redirect on completion"
3. Set redirect URL to:
   ```
   @return_url?status=1&tracking_id=@tracking_id
   ```
   (@ symbol references the hidden field value)

**Step 4: Add Logic for Terminate**
1. Add "Logic Jump" on screening questions
2. If user doesn't qualify → Jump to "Terminate Ending"
3. Create separate ending with redirect:
   ```
   @return_url?status=2&tracking_id=@tracking_id
   ```

**Step 5: Share URL with Binary & Beyond**
Send them your Typeform base URL:
```
https://form.typeform.com/to/ABC123
```

---

## Testing Guide

### Test with HTML File (For Binary & Beyond Team)

**For initial testing**, use the provided `test-survey.html`:

1. **Create Survey:**
   - Name: `Test Survey`
   - Client URL: `file:///d:/survey-redirect-layer/test-survey.html`

2. **Add Test Vendor:**
   - Name: `Test Vendor`
   - Entry Parameter: `user_id`
   - Base Redirect URL: `https://httpbin.org/get`

3. **Open Entry URL:**
   ```
   http://localhost:5000/r/test-survey/test-vendor?user_id=TEST123
   ```

4. **Click Exit Buttons:**
   - Test all 4 statuses
   - Verify countdown and redirect

---

### Test with Real Client Survey

**Once client has configured their survey:**

1. **Get test entry URL** from Binary & Beyond admin
2. **Open entry URL** in browser
3. **Complete the survey** on client's platform
4. **Verify redirect** back to exit callback
5. **Check vendor receives** correct user_id and status

---

## Troubleshooting

### Issue 1: Survey doesn't redirect back

**Cause:** Client's survey platform doesn't support custom redirects

**Solution:**
- Ask client to use a platform that supports redirects (Typeform, Qualtrics)
- OR implement webhook-based integration (advanced)

---

### Issue 2: tracking_id not found

**Cause:** Client didn't configure hidden fields/embedded data

**Solution:**
- Send client detailed instructions for their specific platform
- Test the integration before going live

---

### Issue 3: Vendor receives wrong user_id

**Cause:** Session not found or expired

**Solution:**
- Ensure tracking_id is correctly passed
- Check session hasn't expired (default: 24 hours)

---

## Summary for Different Scenarios

### Scenario 1: Client uses Typeform ✅
1. Admin creates survey in dashboard
2. Admin sends client the exit callback URL
3. Client configures Typeform with hidden fields
4. Client sets redirect URL in Typeform endings
5. ✅ **Works perfectly**

### Scenario 2: Client uses Qualtrics ✅
1. Admin creates survey in dashboard
2. Admin sends client the exit callback URL
3. Client adds embedded data in Qualtrics
4. Client sets end-of-survey redirect
5. ✅ **Works perfectly**

### Scenario 3: Client uses Google Forms ❌
1. Admin creates survey in dashboard
2. Admin sends client the exit callback URL
3. Client tries to configure Google Forms
4. ❌ **Cannot configure redirect**
5. **Solution:** Ask client to use Typeform instead

### Scenario 4: Client uses SurveyMonkey Free ❌
1. Admin creates survey in dashboard
2. Admin sends client the exit callback URL
3. Client tries to configure SurveyMonkey
4. ❌ **Redirect only available on paid plans**
5. **Solution:** Client upgrades to paid plan OR uses Typeform

---

## Recommended Survey Platforms for Clients

### Best Options:

1. **Typeform** ⭐⭐⭐
   - Easy to use
   - Free tier available
   - Perfect integration support

2. **Qualtrics** ⭐⭐⭐
   - Professional features
   - Full redirect control
   - Requires subscription

3. **SurveySparrow** ⭐⭐
   - Good free tier
   - Supports redirects

---

## Contact

If you have questions about integrating your survey platform, contact:
- Email: support@binaryandbeyondresearch.com
- Documentation: See ADMIN_TESTING_GUIDE.md

---

**Last Updated:** February 28, 2026
**Version:** 1.0
