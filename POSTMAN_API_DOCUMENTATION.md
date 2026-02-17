# Survey Redirect System - API Documentation

## Base URL
```
Production: https://binarybeyondresearch.com
Development: http://localhost:5000
```

---

## 📖 System Overview

This system manages survey redirect workflows with automatic slug generation, public status pages, and vendor tracking. The workflow follows these phases:

1. **Create Survey** → Auto-generates slug and status pages
2. **Share Status Pages** → Client reviews public pages
3. **Configure Survey** → Add client survey URL and exit callback
4. **Add Vendors** → Create vendor entry URLs
5. **Live Traffic** → Route respondents through the system

---

## 🔐 Authentication Endpoints

### 1. Register User (First Admin)
**POST** `/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@binarybeyondresearch.com",
  "password": "Admin1234",
  "name": "Admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65abc123def456789",
    "email": "admin@binarybeyondresearch.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

---

### 2. Login
**POST** `/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@binarybeyondresearch.com",
  "password": "Admin1234"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65abc123def456789",
    "email": "admin@binarybeyondresearch.com",
    "name": "Admin",
    "role": "admin",
    "lastLogin": "2024-01-24T10:30:00.000Z"
  }
}
```

**⚠️ IMPORTANT: Save the token - required for all authenticated endpoints.**

---

### 3. Get Current User
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "65abc123def456789",
    "email": "admin@binarybeyondresearch.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

---

## 📊 Survey Management - PHASE 1: Create Survey

### 4. Create New Survey
**POST** `/api/surveys`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Dettol Product Survey",
  "description": "Customer feedback on Dettol products",
  "clientUrl": "https://placeholder.com/survey",
  "isActive": true,
  "completePageMessage": "Thank you for your participation. The survey has been completed successfully.",
  "terminatePageMessage": "Thank you for your participation. You do not meet the criteria for this study.",
  "quotaFullPageMessage": "Thank you for your participation. The required quota has been completed.",
  "securityTermPageMessage": "Thank you for your participation."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789def012345",
    "name": "Dettol Product Survey",
    "surveySlug": "dettol-product-survey-2026",
    "description": "Customer feedback on Dettol products",
    "clientUrl": "https://placeholder.com/survey",
    "isActive": true,
    "completePageMessage": "Thank you for your participation. The survey has been completed successfully.",
    "terminatePageMessage": "Thank you for your participation. You do not meet the criteria for this study.",
    "quotaFullPageMessage": "Thank you for your participation. The required quota has been completed.",
    "securityTermPageMessage": "Thank you for your participation.",
    "createdBy": "65abc123def456789",
    "totalSessions": 0,
    "completedSessions": 0,
    "quotaFullSessions": 0,
    "terminatedSessions": 0,
    "createdAt": "2026-02-15T11:00:00.000Z"
  }
}
```

**📌 Note:** System automatically generates `surveySlug` from name + year.

---

### 5. Get Survey Status Page URLs
**GET** `/api/surveys/{surveyId}/status-urls`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "complete": "http://binarybeyondresearch.com/dettol-product-survey-2026/complete",
    "terminate": "http://binarybeyondresearch.com/dettol-product-survey-2026/terminate",
    "quotaFull": "http://binarybeyondresearch.com/dettol-product-survey-2026/quotafull",
    "security": "http://binarybeyondresearch.com/dettol-product-survey-2026/security",
    "exitCallback": "http://binarybeyondresearch.com/exit/dettol-product-survey-2026"
  }
}
```

**📌 Use Case:** Share these URLs with the client for PHASE 2-3 approval.

---

## 🌐 Public Status Pages - PHASE 2-3: Client Reviews

### 6. View Complete Page (Public)
**GET** `/{surveySlug}/complete`

**No Authentication Required**

**Example URL:**
```
GET http://binarybeyondresearch.com/dettol-product-survey-2026/complete
```

**Response:**
- Returns HTML page with complete message
- Shows survey name and thank you message
- Status Code: 1

---

### 7. View Terminate Page (Public)
**GET** `/{surveySlug}/terminate`

**No Authentication Required**

**Example URL:**
```
GET http://binarybeyondresearch.com/dettol-product-survey-2026/terminate
```

**Response:**
- Returns HTML page with terminate message
- Shows "Not Qualified" title
- Status Code: 2

---

### 8. View Quota Full Page (Public)
**GET** `/{surveySlug}/quotafull`

**No Authentication Required**

**Example URL:**
```
GET http://binarybeyondresearch.com/dettol-product-survey-2026/quotafull
```

**Response:**
- Returns HTML page with quota full message
- Shows "Survey Full" title
- Status Code: 3

---

### 9. View Security Page (Public)
**GET** `/{surveySlug}/security`

**No Authentication Required**

**Example URL:**
```
GET http://binarybeyondresearch.com/dettol-product-survey-2026/security
```

**Response:**
- Returns HTML page with security message
- Shows "Session Expired" title
- Status Code: 4

---

## ⚙️ Survey Configuration - PHASE 4: Configure Survey

### 10. Update Survey Configuration
**PUT** `/api/surveys/{surveyId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "clientUrl": "https://surveyplatform.com/dettol-survey/?user_id=",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789def012345",
    "name": "Dettol Product Survey",
    "surveySlug": "dettol-product-survey-2026",
    "clientUrl": "https://surveyplatform.com/dettol-survey/?user_id=",
    "isActive": true,
    "updatedAt": "2026-02-15T11:30:00.000Z"
  }
}
```

**📌 Share with Client:**
After updating client URL, share the exit callback instructions:
- Complete: `http://binarybeyondresearch.com/exit/dettol-product-survey-2026?status=1`
- Terminate: `http://binarybeyondresearch.com/exit/dettol-product-survey-2026?status=2`
- Quota Full: `http://binarybeyondresearch.com/exit/dettol-product-survey-2026?status=3`
- Security: `http://binarybeyondresearch.com/exit/dettol-product-survey-2026?status=4`

---

## 👥 Vendor Management - PHASE 5: Add Vendors

### 11. Add Vendor to Survey
**POST** `/api/surveys/{surveyId}/vendors`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "TrendOpinion",
  "entryParameter": "user_id",
  "parameterPlaceholder": "TOID",
  "baseRedirectUrl": "https://trendopinion.com/callback",
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65def123abc456789",
    "surveyId": "65abc789def012345",
    "name": "TrendOpinion",
    "vendorSlug": "trendopinion-2026",
    "entryParameter": "user_id",
    "parameterPlaceholder": "TOID",
    "baseRedirectUrl": "https://trendopinion.com/callback",
    "completeUrl": "https://trendopinion.com/callback?status=1&user_id={{TOID}}",
    "terminateUrl": "https://trendopinion.com/callback?status=2&user_id={{TOID}}",
    "quotaFullUrl": "https://trendopinion.com/callback?status=3&user_id={{TOID}}",
    "securityTermUrl": "https://trendopinion.com/callback?status=4&user_id={{TOID}}",
    "isActive": true,
    "totalSessions": 0,
    "completedSessions": 0,
    "quotaFullSessions": 0,
    "terminatedSessions": 0,
    "createdAt": "2026-02-15T12:00:00.000Z"
  }
}
```

**📌 Note:** System auto-generates:
- `vendorSlug` from vendor name
- 4 status URLs with custom parameters
- Placeholder replacement pattern

---

### 12. Get Vendor Entry URL
**GET** `/api/vendors/{vendorId}/url`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "vendorName": "TrendOpinion",
    "entryUrl": "http://binarybeyondresearch.com/r/dettol-product-survey-2026/trendopinion-2026"
  }
}
```

**📌 Share with Vendor:**
Send this URL to the vendor:
```
http://binarybeyondresearch.com/r/dettol-product-survey-2026/trendopinion-2026?user_id={YOUR_ID}
```

Example:
```
http://binarybeyondresearch.com/r/dettol-product-survey-2026/trendopinion-2026?user_id=TOID123
```

---

### 13. Get Vendors for Survey
**GET** `/api/surveys/{surveyId}/vendors`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65def123abc456789",
      "surveyId": "65abc789def012345",
      "name": "TrendOpinion",
      "vendorSlug": "trendopinion-2026",
      "entryParameter": "user_id",
      "parameterPlaceholder": "TOID",
      "baseRedirectUrl": "https://trendopinion.com/callback",
      "isActive": true,
      "totalSessions": 100,
      "completedSessions": 60,
      "quotaFullSessions": 15,
      "terminatedSessions": 25,
      "createdAt": "2026-02-15T12:00:00.000Z"
    }
  ]
}
```

---

### 14. Update Vendor
**PUT** `/api/vendors/{vendorId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "TrendOpinion Updated",
  "entryParameter": "respondent_id",
  "parameterPlaceholder": "RID",
  "baseRedirectUrl": "https://trendopinion.com/new-callback",
  "isActive": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65def123abc456789",
    "name": "TrendOpinion Updated",
    "entryParameter": "respondent_id",
    "parameterPlaceholder": "RID",
    "baseRedirectUrl": "https://trendopinion.com/new-callback",
    "completeUrl": "https://trendopinion.com/new-callback?status=1&respondent_id={{RID}}",
    "terminateUrl": "https://trendopinion.com/new-callback?status=2&respondent_id={{RID}}",
    "quotaFullUrl": "https://trendopinion.com/new-callback?status=3&respondent_id={{RID}}",
    "securityTermUrl": "https://trendopinion.com/new-callback?status=4&respondent_id={{RID}}",
    "isActive": false
  }
}
```

---

### 15. Delete Vendor
**DELETE** `/api/vendors/{vendorId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

---

## 🔄 Live Traffic Flow - PHASE 6: Redirect Endpoints (Public)

### 16. Vendor Entry Point
**GET** `/r/{surveySlug}/{vendorSlug}`

**No Authentication Required**

**Example URL:**
```
GET http://binarybeyondresearch.com/r/dettol-product-survey-2026/trendopinion-2026?user_id=TOID123&age=25&gender=M
```

**What Happens:**
1. System creates session with tracking ID (e.g., `TRACK_ABC999`)
2. Captures vendor ID (`TOID123`) and all query parameters
3. Redirects to client survey URL with tracking ID

**Redirect Location:**
```
https://surveyplatform.com/dettol-survey/?user_id=TOID123&age=25&gender=M&tracking_id=TRACK_ABC999&return_url=http://binarybeyondresearch.com/exit/dettol-product-survey-2026
```

**Response:**
- **302 Redirect** to client survey
- Creates session in database
- Preserves all query parameters

---

### 17. Survey Exit Callback
**GET** `/exit/{surveySlug}`

**No Authentication Required**

**Example URLs:**

**Complete:**
```
GET http://binarybeyondresearch.com/exit/dettol-product-survey-2026?status=1&tracking_id=TRACK_ABC999
```

**Terminate:**
```
GET http://binarybeyondresearch.com/exit/dettol-product-survey-2026?status=2&tracking_id=TRACK_ABC999
```

**Quota Full:**
```
GET http://binarybeyondresearch.com/exit/dettol-product-survey-2026?status=3&tracking_id=TRACK_ABC999
```

**Security:**
```
GET http://binarybeyondresearch.com/exit/dettol-product-survey-2026?status=4&tracking_id=TRACK_ABC999
```

**What Happens:**
1. System looks up session by tracking ID
2. Updates session status
3. Shows branded thank you page
4. After 3 seconds, redirects to vendor callback URL
5. Replaces `{{TOID}}` with actual user ID from session

**Response:**
- Returns HTML thank you page
- Auto-redirects to vendor after 3 seconds
- Vendor receives: `https://trendopinion.com/callback?status=1&user_id=TOID123`

**Status Code Mapping:**
- `status=1` or `status=complete` → Complete
- `status=2` or `status=terminate` → Terminate
- `status=3` or `status=quotafull` → Quota Full
- `status=4` or `status=security` → Security

---

## 📈 Statistics & Analytics

### 18. Get Survey Statistics
**GET** `/api/surveys/{surveyId}/stats`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalVendors": 3,
    "activeVendors": 2,
    "totalSessions": 250,
    "activeSessions": 5,
    "completedSessions": 150,
    "quotaFullSessions": 45,
    "terminatedSessions": 50,
    "avgSessionDuration": 185000
  }
}
```

---

### 19. Get Vendor Statistics
**GET** `/api/vendors/{vendorId}/stats`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSessions": 100,
    "activeSessions": 2,
    "completedSessions": 60,
    "quotaFullSessions": 15,
    "terminatedSessions": 23,
    "avgSessionDuration": 180000,
    "conversionRate": "60.00"
  }
}
```

---

### 20. Get All Surveys
**GET** `/api/surveys`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65abc789def012345",
      "name": "Dettol Product Survey",
      "surveySlug": "dettol-product-survey-2026",
      "description": "Customer feedback on Dettol products",
      "clientUrl": "https://surveyplatform.com/dettol-survey/?user_id=",
      "isActive": true,
      "totalSessions": 150,
      "completedSessions": 75,
      "quotaFullSessions": 20,
      "terminatedSessions": 55,
      "createdBy": {
        "name": "Admin",
        "email": "admin@binarybeyondresearch.com"
      },
      "createdAt": "2026-02-15T10:00:00.000Z"
    }
  ]
}
```

---

### 21. Get Single Survey
**GET** `/api/surveys/{surveyId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789def012345",
    "name": "Dettol Product Survey",
    "surveySlug": "dettol-product-survey-2026",
    "description": "Customer feedback on Dettol products",
    "clientUrl": "https://surveyplatform.com/dettol-survey/?user_id=",
    "isActive": true,
    "completePageMessage": "Thank you for your participation...",
    "terminatePageMessage": "Thank you for your participation...",
    "quotaFullPageMessage": "Thank you for your participation...",
    "securityTermPageMessage": "Thank you for your participation.",
    "createdBy": {
      "_id": "65abc123def456789",
      "name": "Admin",
      "email": "admin@binarybeyondresearch.com"
    },
    "totalSessions": 150,
    "completedSessions": 75,
    "createdAt": "2026-02-15T10:00:00.000Z"
  }
}
```

---

### 22. Delete Survey
**DELETE** `/api/surveys/{surveyId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

**⚠️ Warning:** Deletes all associated vendors and sessions.

---

## 🧪 Complete Testing Workflow

### Step 1: Setup (PHASE 1)
```bash
# 1. Register/Login
POST /api/auth/register
POST /api/auth/login

# 2. Create Survey
POST /api/surveys
{
  "name": "Test Survey",
  "description": "Testing the new flow",
  "clientUrl": "https://placeholder.com/survey",
  "isActive": true
}

# 3. Get Status URLs (for PHASE 2-3)
GET /api/surveys/{surveyId}/status-urls
```

### Step 2: Share with Client (PHASE 2-3)
```bash
# Share these public URLs with client:
GET /test-survey-2026/complete
GET /test-survey-2026/terminate
GET /test-survey-2026/quotafull
GET /test-survey-2026/security

# Client reviews and approves
```

### Step 3: Configure Survey (PHASE 4)
```bash
# After client approval, update survey URL
PUT /api/surveys/{surveyId}
{
  "clientUrl": "https://surveyplatform.com/survey/?user_id="
}

# Share exit callback with client:
# http://binarybeyondresearch.com/exit/test-survey-2026?status={1-4}
```

### Step 4: Add Vendors (PHASE 5)
```bash
# Add vendor
POST /api/surveys/{surveyId}/vendors
{
  "name": "TestVendor",
  "entryParameter": "user_id",
  "parameterPlaceholder": "TOID",
  "baseRedirectUrl": "https://testvendor.com/callback"
}

# Get entry URL
GET /api/vendors/{vendorId}/url

# Share with vendor:
# http://binarybeyondresearch.com/r/test-survey-2026/testvendor-2026?user_id={ID}
```

### Step 5: Test Live Flow (PHASE 6)
```bash
# 1. Vendor sends traffic
GET /r/test-survey-2026/testvendor-2026?user_id=TEST123

# 2. System redirects to survey with tracking_id=TRACK_XYZ

# 3. Survey completes and calls back
GET /exit/test-survey-2026?status=1&tracking_id=TRACK_XYZ

# 4. System shows thank you page
# 5. Auto-redirects to vendor: https://testvendor.com/callback?status=1&user_id=TEST123
```

### Step 6: Check Analytics
```bash
# Get survey stats
GET /api/surveys/{surveyId}/stats

# Get vendor stats
GET /api/vendors/{vendorId}/stats
```

---

## 📝 Postman Environment Variables

Create a Postman environment with:

```json
{
  "baseUrl": "http://localhost:5000",
  "token": "",
  "surveyId": "",
  "vendorId": "",
  "surveySlug": "",
  "vendorSlug": "",
  "trackingId": ""
}
```

### Auto-set Token After Login
Add to Login request "Tests" tab:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
}
```

### Auto-set IDs After Creating Resources
Add to Create Survey "Tests" tab:
```javascript
if (pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("surveyId", jsonData.data._id);
    pm.environment.set("surveySlug", jsonData.data.surveySlug);
}
```

---

## 🚨 Common Errors

### 401 Unauthorized
```json
{
  "error": "Not authorized, no token"
}
```
**Solution:** Add `Authorization: Bearer {token}` header

### 404 Survey Not Found
```json
{
  "error": "Survey not found"
}
```
**Solution:** Check survey ID or slug

### 400 Invalid Status
```json
{
  "error": "Invalid status value"
}
```
**Solution:** Use status values 1-4 or complete/terminate/quotafull/security

### 500 Survey URL Not Configured
```
Survey URL is not properly configured
```
**Solution:** Update survey with valid clientUrl starting with http:// or https://

---

## 🎯 Key Differences from Old System

| Feature | Old System | New System |
|---------|-----------|------------|
| Survey ID | UUID | Readable slug (e.g., `dettol-2026`) |
| Vendor Entry | `/v/{uuid}` | `/r/{survey}/{vendor}` |
| Exit Callback | `/r/{sessionId}` | `/exit/{surveySlug}` |
| Tracking | Session ID | Tracking ID (`TRACK_ABC999`) |
| Status Pages | Not public | Public at `/{slug}/{status}` |
| Vendor URLs | 3 separate URLs | 1 base URL, 4 auto-generated |
| Parameters | Fixed | Custom per vendor |

---

## 📌 Important Notes

1. **Survey slugs are auto-generated** from name + year
2. **Vendor slugs are auto-generated** from name + year
3. **Tracking IDs are auto-generated** for each session
4. **Status pages are public** - no authentication required
5. **Query parameters are preserved** through entire flow
6. **Placeholder replacement** - `{{TOID}}` replaced with actual user ID
7. **3-second auto-redirect** on thank you pages
8. **BASE_URL environment variable** controls domain in generated URLs

---

**For complete workflow details, see:** [new_workflow_pdf.md](new_workflow_pdf.md)
