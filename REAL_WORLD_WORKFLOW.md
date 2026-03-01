# Real-World Survey Redirect Workflow

## Complete End-to-End Example

This document shows **exactly** how the system works in real production scenarios with actual clients.

---

## Example Scenario

**Client:** Colgate (Toothpaste Survey)
**Vendors:** 3 panel companies (TrendOpinion, Dynata, Lucid)
**Survey Platform:** Typeform
**Expected Completes:** 500 per vendor

---

## ⚡ Quick Overview: Who Does What?

### Binary & Beyond Admin:
1. ✅ Create survey in dashboard (WITHOUT client survey URL initially)
2. ✅ Configure thank you messages
3. ✅ Add vendors and their redirect URLs
4. ✅ Share exit callback URL with client
5. ⏸️ **WAIT** for client to create their survey
6. ✅ Receive client's survey URL
7. ✅ **UPDATE Configuration tab** with client survey URL
8. ✅ Share vendor entry URLs with vendors

### Client (Colgate):
1. ✅ Create survey on their platform (Typeform)
2. ✅ Configure hidden fields for tracking_id and return_url
3. ✅ Set up redirect URLs for each ending (complete, terminate, quota)
4. ✅ **Share their Typeform URL with Binary & Beyond**
5. ✅ Test the integration

### Vendors (TrendOpinion, Dynata, Lucid):
1. ✅ Receive entry URL from Binary & Beyond
2. ✅ Send traffic using the entry URL
3. ✅ Receive return redirects with status codes

---

## Phase 1: Admin Setup (Binary & Beyond Team)

### Step 1: Create Survey (Initial Setup)

**Action:** Go to dashboard → Create New Survey

**Form Data:**
```
Survey Name: Colgate Toothpaste Study 2026
Description: Consumer preferences for toothpaste brands
Client Survey URL: (Leave empty for now - will add after client provides their URL)
Status: Active
```

**Result:**
- Survey ID (slug): `colgate-toothpaste-study-2026`
- Survey created successfully

**⚠️ Important:** The Client Survey URL is empty at this stage. We need to wait for the client to create their survey first and provide us with the URL.

---

### Step 2: Configure Thank You Messages

**Action:** Go to Thank You Pages tab → Edit each message

**Messages:**
```
Complete:
Thank you for completing the Colgate survey! Your feedback is valuable
and will help us improve our products.

Terminate:
Thank you for your interest. Unfortunately, you do not meet the criteria
for this study at this time.

Quota Full:
Thank you for your interest. The required number of respondents for this
survey has been reached.

Security Term:
Thank you for your participation. This session has been flagged for
quality assurance purposes.
```

---

### Step 3: Add Vendors

**Vendor 1: TrendOpinion**

```
Name: TrendOpinion
Entry Parameter: pid
Parameter Placeholder: TOID
Base Redirect URL: https://survey.trendopinion.com/simpleProcess.php
Status: Active
```

**Generated URLs:**
- Entry: `https://binaryandbeyondresearch.com/r/colgate-toothpaste-study-2026/trendopinion?pid={YOUR_ID}`
- Complete: `https://survey.trendopinion.com/simpleProcess.php?status=1&pid={{TOID}}`
- Terminate: `https://survey.trendopinion.com/simpleProcess.php?status=2&pid={{TOID}}`
- Quota Full: `https://survey.trendopinion.com/simpleProcess.php?status=3&pid={{TOID}}`
- Security: `https://survey.trendopinion.com/simpleProcess.php?status=4&pid={{TOID}}`

---

**Vendor 2: Dynata**

```
Name: Dynata
Entry Parameter: rid
Parameter Placeholder: RID
Base Redirect URL: https://www.samplicio.us/router/default.aspx
Status: Active
```

**Generated URLs:**
- Entry: `https://binaryandbeyondresearch.com/r/colgate-toothpaste-study-2026/dynata?rid={YOUR_ID}`
- Complete: `https://www.samplicio.us/router/default.aspx?status=1&rid={{RID}}`
- Terminate: `https://www.samplicio.us/router/default.aspx?status=2&rid={{RID}}`
- Quota Full: `https://www.samplicio.us/router/default.aspx?status=3&rid={{RID}}`
- Security: `https://www.samplicio.us/router/default.aspx?status=4&rid={{RID}}`

---

**Vendor 3: Lucid**

```
Name: Lucid
Entry Parameter: respondentID
Parameter Placeholder: RESPID
Base Redirect URL: https://ups.surveysampling.com/samplirouter/statusUpdate
Status: Active
```

**Generated URLs:**
- Entry: `https://binaryandbeyondresearch.com/r/colgate-toothpaste-study-2026/lucid?respondentID={YOUR_ID}`
- Complete: `https://ups.surveysampling.com/samplirouter/statusUpdate?status=1&respondentID={{RESPID}}`
- Terminate: `https://ups.surveysampling.com/samplirouter/statusUpdate?status=2&respondentID={{RESPID}}`
- Quota Full: `https://ups.surveysampling.com/samplirouter/statusUpdate?status=3&respondentID={{RESPID}}`
- Security: `https://ups.surveysampling.com/samplirouter/statusUpdate?status=4&respondentID={{RESPID}}`

---

## Phase 2: Share URLs with Vendors

### Email to TrendOpinion

```
Subject: Entry URL for Colgate Toothpaste Study

Hi TrendOpinion Team,

Please use the following entry URL to send respondents to our
Colgate Toothpaste Study:

Entry URL:
https://binaryandbeyondresearch.com/r/colgate-toothpaste-study-2026/trendopinion?pid={YOUR_ID}

Important:
- Replace {YOUR_ID} with your actual panelist ID
- We will redirect to your completion URLs automatically
- Expected completes: 500
- Length of Interview: 10 minutes
- Incidence Rate: 60%

Example URL with panelist ID:
https://binaryandbeyondresearch.com/r/colgate-toothpaste-study-2026/trendopinion?pid=TOID123456

Your completion URLs are configured to receive:
- Complete: status=1
- Terminate: status=2
- Quota Full: status=3
- Security: status=4

Best regards,
Binary & Beyond Research
```

### Same email sent to Dynata and Lucid with their respective URLs

---

## Phase 3: Client (Colgate) Survey Configuration

### Typeform Setup

**Step 1: Create Hidden Fields**

In Typeform, add hidden fields:
- `tracking_id`
- `return_url`
- `pid` (or `rid` or `respondentID` - will be different for each vendor)

**Step 2: Add Survey Questions**

1. What is your age?
   - 18-24
   - 25-34
   - 35-44
   - 45-54
   - 55+

2. Do you use toothpaste regularly?
   - Yes → Continue
   - No → TERMINATE

3. Which brand do you currently use?
   - Colgate
   - Crest
   - Sensodyne
   - Other

4. How satisfied are you with your current toothpaste?
   - Very satisfied
   - Satisfied
   - Neutral
   - Dissatisfied
   - Very dissatisfied

... (10 more questions)

**Step 3: Add Logic Jumps**

**Terminate Logic:**
- If age < 18 → Jump to "Terminate Ending"
- If doesn't use toothpaste → Jump to "Terminate Ending"

**Quota Full Logic:**
- If quota for age group reached → Jump to "Quota Full Ending"

**Step 4: Configure Endings**

**Default Ending (Complete):**
- Redirect to: `@return_url?status=1&tracking_id=@tracking_id`

**Terminate Ending:**
- Redirect to: `@return_url?status=2&tracking_id=@tracking_id`

**Quota Full Ending:**
- Redirect to: `@return_url?status=3&tracking_id=@tracking_id`

**Step 5: Share Typeform URL**

Client sends Binary & Beyond the base URL:
```
https://form.typeform.com/to/XYZ789
```

**Step 6: Binary & Beyond Updates Survey Configuration**

After receiving the Typeform URL from the client, Binary & Beyond admin:

1. **Go to:** Survey Detail page for "Colgate Toothpaste Study 2026"
2. **Click:** Configuration tab
3. **Click:** "Edit Configuration" button
4. **Update:** Client Survey URL field:
   ```
   https://form.typeform.com/to/XYZ789
   ```
5. **Click:** Save/Update button

**Screenshot of Configuration Tab:**
```
╔═══════════════════════════════════════════════════════════╗
║ Survey Configuration                  [EDIT CONFIGURATION] ║
╠═══════════════════════════════════════════════════════════╣
║                                                             ║
║ Client Survey URL *                                         ║
║ ┌─────────────────────────────────────────────────────┐   ║
║ │ https://form.typeform.com/to/XYZ789                 │   ║
║ └─────────────────────────────────────────────────────┘   ║
║                                                             ║
║ Exit Callback URL (Share this with client)                  ║
║ ┌─────────────────────────────────────────────────────┐   ║
║ │ https://binaryandbeyondresearch.com/exit/           │   ║
║ │ colgate-toothpaste-study-2026?status={STATUS}       │   ║
║ └─────────────────────────────────────────────────────┘   ║
║                                                             ║
║ Instructions for Client:                                    ║
║ Configure your survey to redirect to this URL when         ║
║ respondents finish:                                         ║
║ • Complete: ...?status=1&tracking_id={tracking_id}         ║
║ • Terminate: ...?status=2&tracking_id={tracking_id}        ║
║ • Quota Full: ...?status=3&tracking_id={tracking_id}       ║
║ • Security: ...?status=4&tracking_id={tracking_id}         ║
║                                                             ║
║ Status                                                      ║
║ ☑ Active                                                   ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝
```

**Result:**
- ✅ Client Survey URL is now configured
- ✅ System can now redirect respondents to the client's Typeform
- ✅ System is ready to start receiving traffic from vendors

---

## Phase 4: The Complete User Journey

### Scenario 1: TrendOpinion Panelist - Complete

**Step 1: Vendor sends traffic**

TrendOpinion sends panelist `TOID123456` to:
```
https://binaryandbeyondresearch.com/r/colgate-toothpaste-study-2026/trendopinion?pid=TOID123456
```

---

**Step 2: Your system captures the entry**

**Backend Action:**
```javascript
// Find survey: colgate-toothpaste-study-2026
// Find vendor: trendopinion
// Create session with tracking_id: TRACK_ABC123
// Store queryParams: { pid: "TOID123456" }
// Increment vendor.totalSessions
// Increment survey.totalSessions
```

**Database Session Created:**
```json
{
  "sessionId": "507f1f77bcf86cd799439011",
  "trackingId": "TRACK_ABC123",
  "surveyId": "colgate-toothpaste-study-2026",
  "vendorId": "trendopinion",
  "queryParams": {
    "pid": "TOID123456"
  },
  "status": "active",
  "entryTime": "2026-02-28T10:15:30Z"
}
```

---

**Step 3: Redirect to client's survey**

**Redirect URL:**
```
https://form.typeform.com/to/XYZ789?tracking_id=TRACK_ABC123&return_url=https://binaryandbeyondresearch.com/exit/colgate-toothpaste-study-2026&pid=TOID123456
```

---

**Step 4: User completes Typeform survey**

User answers all questions successfully → Qualifies

---

**Step 5: Typeform redirects back**

Typeform redirects to:
```
https://binaryandbeyondresearch.com/exit/colgate-toothpaste-study-2026?status=1&tracking_id=TRACK_ABC123
```

---

**Step 6: Your system shows thank you page**

**Backend Action:**
```javascript
// Find session by tracking_id: TRACK_ABC123
// Find vendor: trendopinion
// status=1 → Complete
// Update session.status = "complete"
// Update session.exitTime
// Increment vendor.completedSessions
// Increment survey.completedSessions
// Build final redirect URL by replacing {{TOID}} with "TOID123456"
```

**HTML Response:**
```html
<div>
  <h1>Complete - Colgate Toothpaste Study 2026</h1>
  <p>Thank you for completing the Colgate survey! Your feedback is valuable
     and will help us improve our products.</p>
  <div class="countdown">3</div>
  <p>Redirecting you back in 3 seconds...</p>
</div>
<script>
  setTimeout(() => {
    window.location.href = 'https://survey.trendopinion.com/simpleProcess.php?status=1&pid=TOID123456';
  }, 3000);
</script>
```

---

**Step 7: Auto-redirect to vendor**

After 3 seconds, user is redirected to:
```
https://survey.trendopinion.com/simpleProcess.php?status=1&pid=TOID123456
```

TrendOpinion receives:
- `status=1` → Complete
- `pid=TOID123456` → Their panelist ID
- They credit the panelist
- They bill Binary & Beyond for the complete

---

### Scenario 2: Dynata Panelist - Terminate

**Step 1: Dynata sends traffic**
```
https://binaryandbeyondresearch.com/r/colgate-toothpaste-study-2026/dynata?rid=RID789012
```

**Step 2: System creates session**
- tracking_id: `TRACK_DEF456`
- queryParams: `{ rid: "RID789012" }`

**Step 3: Redirect to Typeform**
```
https://form.typeform.com/to/XYZ789?tracking_id=TRACK_DEF456&return_url=https://binaryandbeyondresearch.com/exit/colgate-toothpaste-study-2026&rid=RID789012
```

**Step 4: User answers screening question**
- "Do you use toothpaste regularly?" → **No**
- Typeform logic: Jump to Terminate Ending

**Step 5: Typeform redirects back**
```
https://binaryandbeyondresearch.com/exit/colgate-toothpaste-study-2026?status=2&tracking_id=TRACK_DEF456
```

**Step 6: System shows terminate message**
```
Thank you for your interest. Unfortunately, you do not meet the
criteria for this study at this time.
```

**Step 7: Auto-redirect to Dynata**
```
https://www.samplicio.us/router/default.aspx?status=2&rid=RID789012
```

Dynata receives:
- `status=2` → Terminate
- `rid=RID789012` → Their respondent ID
- No payment (terminated)

---

### Scenario 3: Lucid Panelist - Quota Full

**Step 1: Lucid sends traffic**
```
https://binaryandbeyondresearch.com/r/colgate-toothpaste-study-2026/lucid?respondentID=RESPID345678
```

**Step 2: Session created**
- tracking_id: `TRACK_GHI789`

**Step 3: Redirect to Typeform**
```
https://form.typeform.com/to/XYZ789?tracking_id=TRACK_GHI789&return_url=...&respondentID=RESPID345678
```

**Step 4: User qualifies but quota is full**
- Age group 25-34 quota = 100
- Current completes for 25-34 = 100
- Typeform logic: Jump to Quota Full Ending

**Step 5: Typeform redirects**
```
https://binaryandbeyondresearch.com/exit/colgate-toothpaste-study-2026?status=3&tracking_id=TRACK_GHI789
```

**Step 6: Show quota full message**
```
Thank you for your interest. The required number of respondents for
this survey has been reached.
```

**Step 7: Redirect to Lucid**
```
https://ups.surveysampling.com/samplirouter/statusUpdate?status=3&respondentID=RESPID345678
```

---

## Phase 5: Reporting & Analytics

### Admin Dashboard Shows:

**Survey: Colgate Toothpaste Study 2026**

**Overall Stats:**
- Total Sessions: 1,845
- Completed: 1,235
- Terminated: 450
- Quota Full: 125
- Security: 35
- Completion Rate: 67%
- Avg Duration: 8.5 minutes

**Vendor Performance:**

| Vendor | Sessions | Complete | Terminate | Quota Full | Security | Complete % |
|--------|----------|----------|-----------|------------|----------|------------|
| TrendOpinion | 687 | 456 | 165 | 50 | 16 | 66.4% |
| Dynata | 612 | 423 | 142 | 38 | 9 | 69.1% |
| Lucid | 546 | 356 | 143 | 37 | 10 | 65.2% |

---

## Summary

### What This System Does:

1. ✅ **Tracks which vendor sent each user** (TrendOpinion vs Dynata vs Lucid)
2. ✅ **Preserves vendor IDs throughout the journey** (TOID123456, RID789012, etc.)
3. ✅ **Routes users to client's survey** (Typeform, Qualtrics, etc.)
4. ✅ **Receives users back from survey** (with status codes)
5. ✅ **Shows branded thank you messages** (customized per survey)
6. ✅ **Returns users to correct vendor** (with their original ID)
7. ✅ **Tracks all analytics** (completes, terminates, duration, etc.)

### What Clients Need to Do:

1. ✅ Create survey on platform that supports custom redirects (Typeform, Qualtrics)
2. ✅ Add hidden fields for tracking_id and return_url
3. ✅ Configure redirect URLs for each ending (complete, terminate, quota)
4. ✅ Share survey URL with Binary & Beyond

### What Vendors Need to Do:

1. ✅ Use the entry URL provided by Binary & Beyond
2. ✅ Append their panelist ID to the URL
3. ✅ Accept the return redirect with status codes

---

## Key Takeaway

**Your system is the middleman that:**
- Knows who sent the traffic (vendor tracking)
- Knows where to send the user (client's survey)
- Knows where to return the user (vendor's completion URL)
- Tracks everything in between (analytics)

**You DON'T host surveys** - clients use their own platforms!

---

**Last Updated:** February 28, 2026
