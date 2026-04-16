# Survey Redirect System - Complete Flow Documentation
## Updated: 28 March 2026

---

## System Overview

The Survey Redirect System is a traffic routing middleware that sits between **Vendors** (traffic sources) and **Client Surveys** (survey platforms). It tracks every respondent's journey and routes them back to the correct vendor with the right status after survey completion.

### Three Actors

| Actor | Role |
|-------|------|
| **Admin** | Configures surveys, vendors, and monitors analytics via the dashboard |
| **Client** | Owns the survey platform (e.g., binaryandbeyondresearch.com). Receives respondents and fires exit URLs when done |
| **Vendor** | Sends respondent traffic (e.g., Google, Yahoo). Receives respondents back with completion status |

---

## Complete Flow (Step by Step)

---

### STEP 1: Create a Survey

**Page:** Dashboard > Surveys > New Survey

**Admin enters:**
- Survey Name (e.g., "Test BG 2026")
- Description (optional)
- Active toggle

**System auto-generates:**
- Survey Slug: `test-bg-2026` (used in all URLs)
- 4 default thank you page messages (Complete, Terminate, Quota Full, Security)

> **Note:** Client Survey URL is NOT needed at this step. It can be added later in Configuration.

**Example:**
```
Survey Name:  Test BG 2026
Survey Slug:  test-bg-2026  (auto-generated)
Status:       Active
```

---

### STEP 2: Configure the Client Survey URL

**Page:** Surveys > Test BG 2026 > CONFIGURATION tab > Edit Configuration

**Admin enters:**
- Client Survey URL: `https://binaryandbeyondresearch.com/survey/123`

This is the actual survey link where respondents will be sent to take the survey.

**Example:**
```
Client Survey URL:  https://binaryandbeyondresearch.com/survey/123
```

---

### STEP 3: Share Exit Callback URLs with the Client

**Page:** Surveys > Test BG 2026 > CONFIGURATION tab

The system generates an **Exit Callback URL** that the client needs to configure in their survey platform. When a respondent finishes the survey, the client's platform should redirect to this URL with the appropriate status code.

**What to share with the client:**
```
Configure your survey to redirect to these URLs when respondents finish:

• Complete:   http://yourserver.com/exit/test-bg-2026?status=1
• Terminate:  http://yourserver.com/exit/test-bg-2026?status=2
• Quota Full: http://yourserver.com/exit/test-bg-2026?status=3
• Security:   http://yourserver.com/exit/test-bg-2026?status=4
```

The `tracking_id` is automatically appended to the survey URL when the respondent enters, and it flows back through the return URL automatically.

---

### STEP 4: Customize Thank You Pages (Optional)

**Page:** Surveys > Test BG 2026 > THANK YOU PAGES tab

Admin can edit the message shown to respondents on each status page:

| Status | Default Message |
|--------|----------------|
| Complete | "Thank you for your participation. The survey has been completed successfully..." |
| Terminate | "Thank you for your participation. Based on your responses, you do not meet the criteria..." |
| Quota Full | "Thank you for your participation. The required quota for this survey has already been completed..." |
| Security | "Thank you for your participation" |

Each message can be customized per survey. Click **Preview** to see how the page looks to respondents.

---

### STEP 5: Review Status Page URLs

**Page:** Surveys > Test BG 2026 > STATUS PAGE URLS tab

The system generates 4 status page URLs that can be shared or used for testing:

```
Complete:   http://yourserver.com/test-bg-2026/complete
Terminate:  http://yourserver.com/test-bg-2026/terminate
Quota Full: http://yourserver.com/test-bg-2026/quotafull
Security:   http://yourserver.com/test-bg-2026/security
```

These pages show the thank you message with a countdown timer and auto-redirect the respondent back to the vendor.

---

### STEP 6: Add Vendors

**Page:** Surveys > Test BG 2026 > Manage Vendors > + Add Vendor

For each vendor, admin enters:

#### Basic Info:
| Field | Example | Description |
|-------|---------|-------------|
| Vendor Name | Google | Name of the vendor/panel |
| Entry Parameter | `user_id` | The query param name the vendor uses to pass their respondent ID |
| Parameter Placeholder | `TOID` | The placeholder token used in redirect URLs (e.g., `{{TOID}}`) |

#### Status Redirect URLs:
These are the URLs **provided by the vendor**. The admin pastes them exactly as the vendor gives them. Each status card has:

| Field | Description |
|-------|-------------|
| Status Name | Label like "Complete", "Terminate", etc. |
| Status Codes | Comma-separated codes that trigger this redirect. Defaults to `1`, `2`, `3`, `4`. Only add extra codes if the vendor uses multiple codes for the same status (e.g., `1, A`) |
| Redirect URL | The vendor's callback URL with placeholder (e.g., `https://vendor.com/callback?status=1&uid={{TOID}}`) |

**Example — Vendor using numeric codes (FACTS FODIND-543):**
```
Entry Parameter:      pid
Parameter Placeholder: FFID

Status Name:   Complete
Status Codes:  1
Redirect URL:  https://app.factsfodina.com/simpleProcess.php?status=1&pid={{FFID}}

Status Name:   Terminate
Status Codes:  2
Redirect URL:  https://app.factsfodina.com/simpleProcess.php?status=2&pid={{FFID}}

Status Name:   Quota Full
Status Codes:  3
Redirect URL:  https://app.factsfodina.com/simpleProcess.php?status=3&pid={{FFID}}

Status Name:   Security Term
Status Codes:  4
Redirect URL:  https://app.factsfodina.com/simpleProcess.php?status=4&pid={{FFID}}
```

**Example — Vendor using letter codes (Yahoo):**
```
Entry Parameter:      resp
Parameter Placeholder: RID

Status Name:   Complete
Status Codes:  A
Redirect URL:  https://yahoo.com/panel/done?s=A&resp={{RID}}

Status Name:   Terminate
Status Codes:  B
Redirect URL:  https://yahoo.com/panel/done?s=B&resp={{RID}}

Status Name:   Quota Full
Status Codes:  C
Redirect URL:  https://yahoo.com/panel/done?s=C&resp={{RID}}

Status Name:   Security
Status Codes:  D
Redirect URL:  https://yahoo.com/panel/done?s=D&resp={{RID}}

Status Name:   Duplicate
Status Codes:  E
Redirect URL:  https://yahoo.com/panel/done?s=E&resp={{RID}}
```

**Example — Vendor using mixed codes (multiple codes for same status):**
```
Status Name:   Complete
Status Codes:  1, A, complete
Redirect URL:  https://vendor.com/callback?status=done&uid={{TOID}}
```
Only use multiple codes when the vendor explicitly sends different values for the same outcome.

> **Key Point:** Status codes default to `1`, `2`, `3`, `4`. Only change them if the vendor uses different codes (letters, words, or different numbers).

> **Key Point:** The number of status cards is flexible. Some vendors have 4 statuses, some have 5 or more (e.g., Duplicate). Use the "+ Add Status" button to add extra cards.

> **Key Point:** Entry Parameter and Parameter Placeholder must match exactly what the vendor uses in their redirect URLs. Check the `{{PLACEHOLDER}}` in the vendor-provided URLs to find the placeholder name.

---

### STEP 7: Share Entry URL with Vendor

**Page:** Surveys > Test BG 2026 > Manage Vendors > Click Link icon on a vendor

After creating a vendor, the system generates a unique **Entry URL** for that vendor. This is the URL the admin shares with the vendor so they can send their traffic.

**Example for Google vendor:**
```
Entry URL:  http://yourserver.com/r/test-bg-2026/google

Share with vendor:
http://yourserver.com/r/test-bg-2026/google?user_id={YOUR_ID}

Example:
http://yourserver.com/r/test-bg-2026/google?user_id=TOID123
```

The vendor will replace `{YOUR_ID}` with their actual respondent ID when sending traffic.

---

### STEP 8: Monitor Analytics

**Page:** Surveys > Test BG 2026 > OVERVIEW tab / STATISTICS tab

Admin can monitor:
- Total sessions, active, completed, terminated, quota full
- Completion rate (%)
- Average session duration
- Session status distribution (pie chart)
- Vendor performance comparison (bar chart)
- Per-vendor conversion rates

---

## Complete Respondent Journey (Example)

Here's what happens when a real respondent goes through the system:

### Setup:
```
Survey:   Test BG 2026
Client:   https://binaryandbeyondresearch.com/survey/123
Vendor:   Google (entry param: user_id, placeholder: TOID)
```

### Step-by-step flow:

```
1. VENDOR SENDS RESPONDENT
   Google sends respondent to:
   http://yourserver.com/r/test-bg-2026/google?user_id=12345

2. SYSTEM PROCESSES ENTRY
   - Identifies survey: test-bg-2026
   - Identifies vendor: google
   - Creates session with tracking_id: TRACK_A1B2C3
   - Stores user_id=12345 in session
   - Increments session counters

3. SYSTEM REDIRECTS TO CLIENT SURVEY
   302 Redirect to:
   https://binaryandbeyondresearch.com/survey/123?user_id=12345&tracking_id=TRACK_A1B2C3&return_url=http://yourserver.com/exit/test-bg-2026

4. RESPONDENT TAKES SURVEY
   Respondent completes the survey on the client's platform.

5. CLIENT FIRES EXIT URL
   Client's survey platform redirects to:
   http://yourserver.com/exit/test-bg-2026?status=1

6. SYSTEM PROCESSES EXIT
   - Finds survey: test-bg-2026
   - Finds session by tracking_id
   - Status = 1 → matches "Complete" in Google's redirect URLs
   - Gets Google's complete URL: https://google.com/survey/callback?status=1&user_id={{TOID}}
   - Replaces {{TOID}} with 12345 (from stored session)
   - Final URL: https://google.com/survey/callback?status=1&user_id=12345

7. SYSTEM SHOWS THANK YOU PAGE
   Displays: "Thank you for your participation. The survey has been completed successfully..."
   Countdown: 3... 2... 1...

8. AUTO-REDIRECT TO VENDOR
   Respondent is redirected to:
   https://google.com/survey/callback?status=1&user_id=12345

   Google receives the respondent back with:
   - status=1 (completed)
   - user_id=12345 (their original respondent ID)
```

---

## Visual Flow Diagram

```
┌──────────┐     Entry URL        ┌──────────────┐     Redirect         ┌────────────────┐
│          │  ────────────────►   │              │  ────────────────►   │                │
│  VENDOR  │  /r/survey/vendor    │    SYSTEM    │  survey_url +       │  CLIENT SURVEY │
│ (Google) │  ?user_id=12345      │  (Redirect   │  tracking_id        │  (Binary &     │
│          │                      │   Engine)    │                     │   Beyond)      │
│          │                      │              │                     │                │
│          │  ◄────────────────   │              │  ◄────────────────  │                │
│          │  vendor_callback     │              │  /exit/survey       │                │
│          │  ?status=1           │  Thank You   │  ?status=1          │                │
│          │  &user_id=12345      │  Page + Auto │                     │                │
└──────────┘  (final redirect)    │  Redirect    │                     └────────────────┘
                                  └──────────────┘
```

---

## Admin Checklist

| # | Task | Page | Share With |
|---|------|------|------------|
| 1 | Create Survey | Surveys > New Survey | - |
| 2 | Set Client Survey URL | Survey Detail > Configuration | - |
| 3 | Share Exit URLs with Client | Survey Detail > Configuration | **Client** |
| 4 | Customize Thank You Pages | Survey Detail > Thank You Pages | - |
| 5 | Add Vendors with their redirect URLs | Survey Detail > Manage Vendors | - |
| 6 | Share Entry URL with each Vendor | Vendors > Link icon | **Each Vendor** |
| 7 | Monitor traffic | Survey Detail > Overview / Statistics | - |

---

## What Gets Shared With Whom

### Share with CLIENT (survey platform owner):
```
Exit Callback URLs:
• Complete:   http://yourserver.com/exit/test-bg-2026?status=1
• Terminate:  http://yourserver.com/exit/test-bg-2026?status=2
• Quota Full: http://yourserver.com/exit/test-bg-2026?status=3
• Security:   http://yourserver.com/exit/test-bg-2026?status=4

"Configure your survey to redirect to these URLs when respondents finish."
```

### Share with each VENDOR:
```
Entry URL:
http://yourserver.com/r/test-bg-2026/google?user_id={YOUR_RESPONDENT_ID}

"Send your traffic to this URL. Replace {YOUR_RESPONDENT_ID} with the actual respondent ID."
```

### Collect from each VENDOR (before adding them):
```
We need from you:
1. Your callback/redirect URLs for each status (complete, terminate, quota full, etc.)
2. What parameter name you use for respondent ID (e.g., user_id, rid, pid)
3. What status codes you use (e.g., 1/2/3/4 or A/B/C/D or complete/terminate/etc.)
```
