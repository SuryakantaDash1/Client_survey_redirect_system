# Admin Testing Guide - Complete Flow

## Overview
This guide walks you through the complete workflow from creating a survey to testing live traffic. Follow each step in order to understand and test the entire system.

---

## 📋 Prerequisites

Before starting, ensure:
- ✅ Backend server is running on `http://localhost:5000`
- ✅ Frontend is running on `http://localhost:3000`
- ✅ You have admin credentials (email + password)
- ✅ BASE_URL in `.env` is set to your domain (e.g., `http://binarybeyondresearch.com`)

---

## PHASE 1: Create a Survey

### Step 1.1: Login to Dashboard
1. Open browser: `http://localhost:3000`
2. Click **Login**
3. Enter credentials:
   - Email: `admin@binarybeyondresearch.com`
   - Password: `Admin1234`
4. Click **Login**

### Step 1.2: Create New Survey
1. Click **Surveys** in sidebar
2. Click **+ NEW SURVEY** button (top right)
3. Fill in the form:
   - **Survey Name**: `Colgate Product Survey`
   - **Description**: `Customer feedback on Colgate products`
   - **Active**: Toggle ON (green)
4. Click **Create**

**✅ What Happens:**
- System auto-generates Survey ID: `colgate-product-survey-2026`
- Creates 4 status page URLs automatically
- Survey appears in the table with "Survey ID" column

### Step 1.3: View Auto-Generated URLs
1. Click the **eye icon** 👁️ next to your survey
2. Click **STATUS PAGE URLS** tab
3. You'll see:
   - **Survey ID**: `colgate-product-survey-2026` (with Copy button)
   - **Complete Page URL**: `http://binarybeyondresearch.com/colgate-product-survey-2026/complete`
   - **Terminate Page URL**: `http://binarybeyondresearch.com/colgate-product-survey-2026/terminate`
   - **Quota Full Page URL**: `http://binarybeyondresearch.com/colgate-product-survey-2026/quotafull`
   - **Security Page URL**: `http://binarybeyondresearch.com/colgate-product-survey-2026/security`
   - **Exit Callback URL**: `http://binarybeyondresearch.com/exit/colgate-product-survey-2026?status={STATUS}`

**📝 Action Required:** Copy all 5 URLs - you'll share these with the client in PHASE 2.

---

## PHASE 2: Share Status Pages with Client

### Step 2.1: Send Email to Client
Create an email like this:

```
To: client@colgate.com
Subject: Colgate Survey - Status Pages Ready for Review

Hi Colgate Team,

Your survey status pages are ready for review. Please click each link below to see what respondents will see:

✅ Complete Page:
http://binarybeyondresearch.com/colgate-product-survey-2026/complete

❌ Terminate Page:
http://binarybeyondresearch.com/colgate-product-survey-2026/terminate

⚠️ Quota Full Page:
http://binarybeyondresearch.com/colgate-product-survey-2026/quotafull

🔒 Security Page:
http://binarybeyondresearch.com/colgate-product-survey-2026/security

Please review the messages and let us know if you'd like any changes.
Once approved, please send us your survey platform URL.

Thanks,
Binary & Beyond Research Team
```

---

## PHASE 3: Client Reviews and Approves

### Step 3.1: Test Status Pages (Simulate Client Review)
Open each URL in a browser to see what the client will see:

1. **Complete Page**:
   - Open: `http://binarybeyondresearch.com/colgate-product-survey-2026/complete`
   - You'll see: "Survey Complete" with thank you message

2. **Terminate Page**:
   - Open: `http://binarybeyondresearch.com/colgate-product-survey-2026/terminate`
   - You'll see: "Not Qualified" with thank you message

3. **Quota Full Page**:
   - Open: `http://binarybeyondresearch.com/colgate-product-survey-2026/quotafull`
   - You'll see: "Survey Full" with thank you message

4. **Security Page**:
   - Open: `http://binarybeyondresearch.com/colgate-product-survey-2026/security`
   - You'll see: "Session Expired" with thank you message

### Step 3.2: Edit Messages (If Client Requests Changes)
If client wants to change the messages:

1. Go back to survey detail page
2. Click **THANK YOU PAGES** tab
3. Click on any status card (Complete, Terminate, Quota Full, Security)
4. Edit the message
5. Click **Update Message**
6. Send updated URLs to client again

### Step 3.3: Client Approval
Once client approves, they will send you their survey URL, for example:
```
https://surveyplatform.com/colgate-survey/?user_id=
```

**✅ Checkpoint:** You now have client's survey URL. Move to PHASE 4.

---

## PHASE 4: Configure Survey

### Step 4.1: Add Client Survey URL
1. Go to survey detail page (click eye icon on survey)
2. Click **CONFIGURATION** tab
3. Click **Edit Configuration** button
4. In **Client Survey URL** field, paste:
   ```
   https://surveyplatform.com/colgate-survey/?user_id=
   ```
5. Click **Save Configuration**

**✅ What Happens:**
- Survey is now configured with client's URL
- Exit callback URL is ready to share

### Step 4.2: Share Exit Callback with Client
1. Copy the **Exit Callback URL** from Configuration tab
2. Send email to client:

```
To: client@colgate.com
Subject: Exit Callback Configuration

Hi Colgate Team,

Thank you for providing your survey URL. Please configure your survey to redirect respondents back to our system when they finish.

Exit Callback URL:
http://binarybeyondresearch.com/exit/colgate-product-survey-2026

Status Codes (append to the URL):
✅ Complete: ?status=1
❌ Terminate: ?status=2
⚠️ Quota Full: ?status=3
🔒 Security: ?status=4

Examples:
- When survey completes: http://binarybeyondresearch.com/exit/colgate-product-survey-2026?status=1
- When respondent terminates: http://binarybeyondresearch.com/exit/colgate-product-survey-2026?status=2

Please also pass the tracking_id parameter we send to you.

Thanks,
Binary & Beyond Research Team
```

**✅ Checkpoint:** Client survey is configured. Move to PHASE 5.

---

## PHASE 5: Add Vendors

### Step 5.1: Add First Vendor
1. From survey detail page, click **MANAGE VENDORS** button (top right)
2. Click **+ ADD VENDOR** button
3. Fill in the form:
   - **Vendor Name**: `TrendOpinion`
   - **Entry Parameter**: `user_id` (the parameter name vendor uses)
   - **Parameter Placeholder**: `TOID` (the name used in their URLs)
   - **Base Redirect URL**: `https://trendopinion.com/callback`
   - **Active**: Toggle ON
4. Click **Create**

**✅ What Happens:**
- System auto-generates vendor slug: `trendopinion-2026`
- Creates 4 return URLs:
  - `https://trendopinion.com/callback?status=1&user_id={{TOID}}`
  - `https://trendopinion.com/callback?status=2&user_id={{TOID}}`
  - `https://trendopinion.com/callback?status=3&user_id={{TOID}}`
  - `https://trendopinion.com/callback?status=4&user_id={{TOID}}`

### Step 5.2: Get Vendor Entry URL
1. Click the **link icon** 🔗 next to the vendor
2. You'll see a dialog with:
   - **Entry URL**: `http://binarybeyondresearch.com/r/colgate-product-survey-2026/trendopinion-2026`
   - **Return URLs**: All 4 auto-generated URLs
3. Click **Copy** icon next to Entry URL

### Step 5.3: Share Entry URL with Vendor
Send email to vendor:

```
To: support@trendopinion.com
Subject: Entry URL for Colgate Survey

Hi TrendOpinion Team,

Please use this URL to send respondents to the Colgate survey:

http://binarybeyondresearch.com/r/colgate-product-survey-2026/trendopinion-2026?user_id={YOUR_ID}

Replace {YOUR_ID} with your respondent's unique identifier.

Example:
http://binarybeyondresearch.com/r/colgate-product-survey-2026/trendopinion-2026?user_id=TOID123

You can add any additional parameters you need (age, gender, etc.) - we'll preserve them.

Thanks,
Binary & Beyond Research Team
```

### Step 5.4: Add More Vendors (Optional)
Repeat steps 5.1-5.3 for each additional vendor (e.g., "Dynata", "Lucid", etc.)

**✅ Checkpoint:** Vendors are set up. Ready to test live traffic!

---

## PHASE 6: Test Live Traffic Flow

Now let's test the complete flow end-to-end.

### Step 6.1: Simulate Vendor Sending Traffic

Open a new browser tab (or use Incognito mode) and visit:
```
http://binarybeyondresearch.com/r/colgate-product-survey-2026/trendopinion-2026?user_id=TEST123&age=25&gender=M
```

**✅ What Happens:**
1. System creates a session with tracking ID (e.g., `TRACK_ABC999`)
2. Stores `user_id=TEST123`, `age=25`, `gender=M`
3. **Immediately redirects** you to:
   ```
   https://surveyplatform.com/colgate-survey/?user_id=TEST123&age=25&gender=M&tracking_id=TRACK_ABC999&return_url=http://binarybeyondresearch.com/exit/colgate-product-survey-2026
   ```

**📝 Note:** Since `surveyplatform.com` is fake, you'll get an error. That's OK - we're just testing the redirect.

### Step 6.2: Verify Redirect Parameters

Look at the URL bar. You should see:
- ✅ `user_id=TEST123` - Original parameter preserved
- ✅ `age=25` - Additional parameter preserved
- ✅ `gender=M` - Additional parameter preserved
- ✅ `tracking_id=TRACK_ABC999` - System-generated tracking ID
- ✅ `return_url=...` - Exit callback URL

**✅ Checkpoint:** Entry redirect is working!

### Step 6.3: Simulate Survey Completion

Since we can't actually complete a fake survey, manually simulate the exit callback.

Open a new tab and visit:
```
http://binarybeyondresearch.com/exit/colgate-product-survey-2026?status=1&tracking_id=TRACK_ABC999
```

**⚠️ Important:** Replace `TRACK_ABC999` with the actual tracking ID from Step 6.1.

**✅ What Happens:**
1. System looks up session by tracking ID
2. Finds vendor = TrendOpinion
3. Finds user_id = TEST123
4. Shows **branded thank you page** (Complete page)
5. After **3 seconds**, auto-redirects to:
   ```
   https://trendopinion.com/callback?status=1&user_id=TEST123
   ```

### Step 6.4: Observe Thank You Page

You should see:
- **Title**: "Survey Complete"
- **Message**: Your configured thank you message
- **Countdown**: "Redirecting in 3... 2... 1..."
- **Auto-redirect** to vendor's complete URL with the actual user ID

**✅ Checkpoint:** Complete flow is working!

### Step 6.5: Test Other Statuses

Test all 4 status codes:

**Terminate:**
```
http://binarybeyondresearch.com/exit/colgate-product-survey-2026?status=2&tracking_id=TRACK_ABC999
```
- Should redirect to: `https://trendopinion.com/callback?status=2&user_id=TEST123`

**Quota Full:**
```
http://binarybeyondresearch.com/exit/colgate-product-survey-2026?status=3&tracking_id=TRACK_ABC999
```
- Should redirect to: `https://trendopinion.com/callback?status=3&user_id=TEST123`

**Security:**
```
http://binarybeyondresearch.com/exit/colgate-product-survey-2026?status=4&tracking_id=TRACK_ABC999
```
- Should redirect to: `https://trendopinion.com/callback?status=4&user_id=TEST123`

**✅ Checkpoint:** All status redirects are working!

---

## 📊 View Analytics

### Step 7.1: Check Survey Statistics
1. Go to survey detail page
2. Click **OVERVIEW** tab
3. You'll see:
   - Total Vendors
   - Total Sessions
   - Completed Sessions
   - Quota Full Sessions
   - Terminated Sessions
   - Completion Rate
   - Avg Session Duration

### Step 7.2: Check Statistics Tab
1. Click **STATISTICS** tab
2. View:
   - Session Status Distribution (Pie Chart)
   - Vendor Performance (Bar Chart)
   - Detailed Statistics

### Step 7.3: Check Vendor Performance
1. Go to **Vendors** page
2. View vendor table with:
   - Sessions per vendor
   - Completed sessions
   - Conversion rate

---

## 🧪 Advanced Testing Scenarios

### Scenario 1: Multiple Vendors
1. Add 3 vendors: TrendOpinion, Dynata, Lucid
2. Send traffic through each vendor's entry URL
3. Verify each vendor gets correct return URLs
4. Check analytics to see per-vendor performance

### Scenario 2: Custom Parameters
Test with different vendors using different parameters:

**Vendor A (TrendOpinion):**
- Entry Parameter: `user_id`
- Placeholder: `TOID`
- Test: `?user_id=TOID123`

**Vendor B (Dynata):**
- Entry Parameter: `respondent_id`
- Placeholder: `RID`
- Test: `?respondent_id=RID456`

**Vendor C (Lucid):**
- Entry Parameter: `pid`
- Placeholder: `PID`
- Test: `?pid=PID789`

Verify each vendor's return URL uses the correct parameter name.

### Scenario 3: Query Parameter Preservation
Send traffic with multiple parameters:
```
http://binarybeyondresearch.com/r/colgate-product-survey-2026/trendopinion-2026?user_id=TEST123&age=25&gender=M&country=US&source=email
```

Verify ALL parameters are:
1. Passed to client survey
2. Returned in exit callback
3. Passed to vendor's return URL

---

## 🐛 Troubleshooting

### Issue: "Survey not found"
**Solution:** Check that survey slug is correct. Copy from Status Page URLs tab.

### Issue: "Vendor not found"
**Solution:** Check that vendor slug is correct. Must match the entry URL.

### Issue: "Invalid tracking ID"
**Solution:** Make sure you're using the actual tracking ID from the entry redirect, not the example `TRACK_ABC999`.

### Issue: Status pages show old messages
**Solution:**
1. Edit messages in Thank You Pages tab
2. Refresh the public status page URLs
3. Clear browser cache

### Issue: Vendor return URL missing user_id
**Solution:**
1. Check that Entry Parameter is configured correctly
2. Verify user_id parameter was passed in entry URL
3. Check session in database to confirm parameter was stored

### Issue: Redirect not working
**Solution:**
1. Check that BASE_URL in `.env` matches your domain
2. Restart backend server after changing `.env`
3. Verify client survey URL is configured in Configuration tab

---

## 📝 Testing Checklist

Use this checklist to verify everything works:

### PHASE 1: Create Survey
- [ ] Survey created successfully
- [ ] Survey ID (slug) auto-generated
- [ ] Survey appears in table
- [ ] Status page URLs visible in detail page

### PHASE 2-3: Status Pages
- [ ] Complete page displays correct message
- [ ] Terminate page displays correct message
- [ ] Quota Full page displays correct message
- [ ] Security page displays correct message
- [ ] Messages can be edited in Thank You Pages tab
- [ ] Preview button shows correct message

### PHASE 4: Configuration
- [ ] Client Survey URL can be updated
- [ ] Exit Callback URL is displayed
- [ ] Copy button works for exit callback
- [ ] Status code instructions are clear

### PHASE 5: Vendors
- [ ] Vendor created successfully
- [ ] Vendor slug auto-generated
- [ ] Entry URL shows correct format
- [ ] All 4 return URLs auto-generated
- [ ] Custom parameters working (user_id, TOID)
- [ ] Entry URL dialog shows all URLs

### PHASE 6: Live Traffic
- [ ] Entry URL redirects to client survey
- [ ] Tracking ID is generated and passed
- [ ] All query parameters preserved
- [ ] Exit callback shows thank you page
- [ ] 3-second countdown works
- [ ] Auto-redirect to vendor works
- [ ] Placeholder {{TOID}} replaced with actual ID
- [ ] All 4 statuses redirect correctly

### Analytics
- [ ] Survey statistics show correct counts
- [ ] Vendor statistics show correct counts
- [ ] Charts display data correctly
- [ ] Session status updates in real-time

---

## 🎯 Real-World Testing

For real testing with actual survey platforms:

1. **Setup test survey** on a real platform (SurveyMonkey, Typeform, etc.)
2. **Configure exit callbacks** in the survey platform
3. **Use real vendor** for testing (or simulate with your own callback server)
4. **Test complete flow** with actual respondent taking survey
5. **Verify data** in analytics dashboard

---

## 📞 Support

If you encounter issues during testing:

1. Check browser console for errors
2. Check backend server logs
3. Verify all URLs are correct
4. Test in incognito mode to avoid cache issues
5. Check database to see if sessions are created

---

## 🎓 Key Takeaways

After completing this testing guide, you should understand:

✅ How to create surveys and auto-generate status pages
✅ How to share status pages with clients for review
✅ How to configure survey URLs and exit callbacks
✅ How to add vendors with custom parameters
✅ How to test the complete redirect flow
✅ How tracking IDs work for session management
✅ How placeholder replacement works for vendor IDs
✅ How to view and interpret analytics

**You're now ready to manage surveys in production!** 🚀
