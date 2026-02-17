# Survey Redirect System
## Complete Workflow Guide

---

## Overview

This document outlines the complete step-by-step process for setting up and managing surveys in the redirect system. Follow each phase in order to ensure proper configuration.

---

## PHASE 1: Create a Survey

### What You Do

1. Log into your dashboard
2. Click "Create New Survey"
3. Enter survey name: "Dettol Product Survey"
4. System automatically creates Survey ID: `dettol-product-2026`

### What the System Does Automatically

Creates 4 status pages:

```
1. binarybeyondresearch.com/dettol-product-2026/complete
   Shows when someone finishes the survey

2. binarybeyondresearch.com/dettol-product-2026/terminate
   Shows when someone doesn't qualify

3. binarybeyondresearch.com/dettol-product-2026/quotafull
   Shows when survey is full

4. binarybeyondresearch.com/dettol-product-2026/security
   Shows when someone fails quality checks
```

**Think of it like:** Creating a folder with 4 different "thank you" notes inside.

---

## PHASE 2: Share Status Pages with Client

### What You Do

Send an email to the client (Dettol):

```
Subject: Your Survey Status Pages are Ready

Hi Dettol Team,

Your survey pages are ready. Please review:

Complete page: 
https://binarybeyondresearch.com/dettol-product-2026/complete

Terminate page: 
https://binarybeyondresearch.com/dettol-product-2026/terminate

Quota Full page: 
https://binarybeyondresearch.com/dettol-product-2026/quotafull

Security page: 
https://binarybeyondresearch.com/dettol-product-2026/security

Let us know if you want to change any messages.
Once approved, please send us your survey link.

Best regards,
Binary & Beyond Research Team
```



---

## PHASE 3: Survey Owner Reviews and Approves

### What the Survey Owner Does

Clicks each link and reviews the status pages.

**Example - Complete Page Shows:**
```
✓ Survey Complete

Thank you for your participation. 
Your inputs are valuable and will help us improve.
```

### Two Possible Outcomes

**Option A: Approved**
- Survey owner says: "Looks good!"
- They approve the pages as-is
- They send you their survey link: 
  `https://surveyplatform.com/dettol-survey/?user_id=`

**Option B: Changes Requested**
- Survey owner says: "Can you change the message?"
- You edit the messages in the dashboard
- They review again
- Once approved, they send survey link

**Real-world example:**
Maybe Dettol wants the complete page to say "Thank you for helping us improve Dettol products!" instead of the generic text.

---

## PHASE 4: Configure the Survey

### What You Do

**Step 1:** Receive survey link from client
```
https://surveyplatform.com/dettol-survey/?user_id=
```

**Step 2:** Enter it in your dashboard
- Go to survey settings
- Paste the survey URL
- Save

**Step 3:** System automatically generates exit callback URL
```
https://binarybeyondresearch.com/exit/dettol-product-2026
```

**Step 4:** Send configuration instructions to survey owner

```
Subject: Exit Callback Configuration

Hi Dettol Team,

Please configure your survey to redirect to this URL when finished:

Base URL:
https://binarybeyondresearch.com/exit/dettol-product-2026

Status codes to append:
- Complete: ?status=1
- Terminate: ?status=2
- Quota Full: ?status=3
- Security: ?status=4

Examples:
When survey completes:
https://binarybeyondresearch.com/exit/dettol-product-2026?status=1

When respondent terminates:
https://binarybeyondresearch.com/exit/dettol-product-2026?status=2

Please preserve all URL parameters when redirecting.

Best regards,
Binary & Beyond Research Team
```


---

## PHASE 5: Add Vendors

### What You Do

Now you add vendors who will send people to the survey.

### Adding Vendor 1 (TrendOpinion)

**Step 1:** Dashboard → Select Survey → Add Vendor

**Step 2:** Enter vendor details

```
Vendor Name: TrendOpinion
Entry Parameter: user_id
Parameter Placeholder: TOID

Complete URL:
https://trendopinion.com/callback?status=1&user_id={{TOID}}

Terminate URL:
https://trendopinion.com/callback?status=2&user_id={{TOID}}

Quota Full URL:
https://trendopinion.com/callback?status=3&user_id={{TOID}}

Security URL:
https://trendopinion.com/callback?status=4&user_id={{TOID}}
```

**Step 3:** System creates vendor entry URL

```
https://binarybeyondresearch.com/r/dettol-product-2026/trendopinion
```

**Step 4:** Share entry URL with vendor

```
Subject: Entry URL for Dettol Product Survey

Hi TrendOpinion Team,

Please send your respondents to this URL:

https://binarybeyondresearch.com/r/dettol-product-2026/trendopinion?user_id={YOUR_ID}

Replace {YOUR_ID} with your respondent identifier.

Example:
https://binarybeyondresearch.com/r/dettol-product-2026/trendopinion?user_id=TOID123

Best regards,
Binary & Beyond Research Team
```

### Repeat for Additional Vendors

Add Vendor 2, Vendor 3, etc. following the same process.

Each vendor gets:
- Their own entry URL
- Their own return URLs (complete, terminate, quota, security)

