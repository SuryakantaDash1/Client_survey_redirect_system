# Survey Redirect System - Postman API Documentation

## Base URL
```
http://localhost:5000
```

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
  "email": "admin@gmail.com",
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
    "email": "admin@gmail.com",
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
  "email": "admin@gmail.com",
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
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "lastLogin": "2024-01-24T10:30:00.000Z"
  }
}
```

**⚠️ IMPORTANT: Copy the token from the response. You'll need it for all other API calls.**

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
    "email": "admin@gmail.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

---

### 4. Update User Details
**PUT** `/api/auth/updatedetails`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Updated Admin Name",
  "email": "newemail@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "65abc123def456789",
    "email": "newemail@example.com",
    "name": "Updated Admin Name",
    "role": "admin"
  }
}
```

---

### 5. Update Password
**PUT** `/api/auth/updatepassword`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "currentPassword": "Admin123!",
  "newPassword": "NewAdmin123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📊 Survey Management Endpoints

### 6. Get All Surveys
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
      "_id": "65abc456def789012",
      "name": "Customer Satisfaction Survey",
      "description": "Q1 2024 Customer Feedback",
      "clientUrl": "https://clientsurvey.com/survey/12345",
      "isActive": true,
      "totalSessions": 150,
      "completedSessions": 75,
      "quotaFullSessions": 20,
      "terminatedSessions": 55,
      "createdBy": {
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

---

### 7. Create New Survey
**POST** `/api/surveys`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Product Feedback Survey 2024",
  "description": "Collecting feedback on our new product line",
  "clientUrl": "https://surveyplatform.com/survey/abc123",
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789def012345",
    "name": "Product Feedback Survey 2024",
    "description": "Collecting feedback on our new product line",
    "clientUrl": "https://surveyplatform.com/survey/abc123",
    "isActive": true,
    "createdBy": "65abc123def456789",
    "totalSessions": 0,
    "completedSessions": 0,
    "quotaFullSessions": 0,
    "terminatedSessions": 0,
    "createdAt": "2024-01-24T11:00:00.000Z"
  }
}
```

---

### 8. Get Single Survey
**GET** `/api/surveys/{surveyId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example URL:**
```
GET http://localhost:5000/api/surveys/65abc789def012345
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789def012345",
    "name": "Product Feedback Survey 2024",
    "description": "Collecting feedback on our new product line",
    "clientUrl": "https://surveyplatform.com/survey/abc123",
    "isActive": true,
    "createdBy": {
      "_id": "65abc123def456789",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "vendors": [],
    "totalSessions": 0,
    "completedSessions": 0,
    "createdAt": "2024-01-24T11:00:00.000Z"
  }
}
```

---

### 9. Update Survey
**PUT** `/api/surveys/{surveyId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Updated Survey Name",
  "description": "Updated description for the survey",
  "clientUrl": "https://newsurveyurl.com/survey/xyz789",
  "isActive": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc789def012345",
    "name": "Updated Survey Name",
    "description": "Updated description for the survey",
    "clientUrl": "https://newsurveyurl.com/survey/xyz789",
    "isActive": false,
    "updatedAt": "2024-01-24T11:30:00.000Z"
  }
}
```

---

### 10. Delete Survey
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

---

### 11. Get Survey Statistics
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

## 👥 Vendor Management Endpoints

### 12. Get Vendors for a Survey
**GET** `/api/surveys/{surveyId}/vendors`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example URL:**
```
GET http://localhost:5000/api/surveys/65abc789def012345/vendors
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
      "name": "Vendor A - Research Panel",
      "vendorUuid": "550e8400-e29b-41d4-a716-446655440001",
      "completeUrl": "https://vendora.com/complete?id={{ID}}",
      "quotaFullUrl": "https://vendora.com/quotafull?id={{ID}}",
      "terminateUrl": "https://vendora.com/terminate?id={{ID}}",
      "isActive": true,
      "totalSessions": 100,
      "completedSessions": 60,
      "quotaFullSessions": 15,
      "terminatedSessions": 25,
      "createdAt": "2024-01-24T12:00:00.000Z"
    }
  ]
}
```

---

### 13. Add Vendor to Survey
**POST** `/api/surveys/{surveyId}/vendors`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Vendor B - Online Panel",
  "completeUrl": "https://vendorb.com/survey/complete?respondent={{RID}}&status=1",
  "quotaFullUrl": "https://vendorb.com/survey/quotafull?respondent={{RID}}&status=2",
  "terminateUrl": "https://vendorb.com/survey/terminate?respondent={{RID}}&status=3",
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "65def456abc789012",
    "surveyId": "65abc789def012345",
    "name": "Vendor B - Online Panel",
    "vendorUuid": "550e8400-e29b-41d4-a716-446655440002",
    "completeUrl": "https://vendorb.com/survey/complete?respondent={{RID}}&status=1",
    "quotaFullUrl": "https://vendorb.com/survey/quotafull?respondent={{RID}}&status=2",
    "terminateUrl": "https://vendorb.com/survey/terminate?respondent={{RID}}&status=3",
    "isActive": true,
    "totalSessions": 0,
    "completedSessions": 0,
    "quotaFullSessions": 0,
    "terminatedSessions": 0,
    "createdAt": "2024-01-24T12:30:00.000Z"
  }
}
```

**📌 Note: Save the `vendorUuid` - you'll need it for the redirect testing!**

---

### 14. Get Single Vendor
**GET** `/api/vendors/{vendorId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65def456abc789012",
    "surveyId": {
      "_id": "65abc789def012345",
      "name": "Product Feedback Survey 2024"
    },
    "name": "Vendor B - Online Panel",
    "vendorUuid": "550e8400-e29b-41d4-a716-446655440002",
    "completeUrl": "https://vendorb.com/survey/complete?respondent={{RID}}&status=1",
    "quotaFullUrl": "https://vendorb.com/survey/quotafull?respondent={{RID}}&status=2",
    "terminateUrl": "https://vendorb.com/survey/terminate?respondent={{RID}}&status=3",
    "isActive": true
  }
}
```

---

### 15. Update Vendor
**PUT** `/api/vendors/{vendorId}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Updated Vendor Name",
  "completeUrl": "https://newvendorurl.com/complete",
  "quotaFullUrl": "https://newvendorurl.com/quota",
  "terminateUrl": "https://newvendorurl.com/terminate",
  "isActive": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65def456abc789012",
    "name": "Updated Vendor Name",
    "completeUrl": "https://newvendorurl.com/complete",
    "quotaFullUrl": "https://newvendorurl.com/quota",
    "terminateUrl": "https://newvendorurl.com/terminate",
    "isActive": false
  }
}
```

---

### 16. Delete Vendor
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

### 17. Get Vendor Entry URL
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
    "vendorName": "Vendor B - Online Panel",
    "entryUrl": "http://localhost:5000/v/550e8400-e29b-41d4-a716-446655440002",
    "vendorUuid": "550e8400-e29b-41d4-a716-446655440002"
  }
}
```

---

### 18. Get Vendor Statistics
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

## 🔄 Redirect Endpoints (Public - No Auth Required)

### 19. Vendor Entry Point (Simulate Vendor Traffic)
**GET** `/v/{vendorUuid}`

**No Authentication Required**

**Example URL with Parameters:**
```
GET http://localhost:5000/v/550e8400-e29b-41d4-a716-446655440002?rid=USER123&source=email&age=25
```

**Response:**
- **302 Redirect** to client survey URL with tracking parameters
- The browser will automatically redirect to the survey URL
- In Postman, you'll see the redirect location in the headers

**Response Headers:**
```
Location: https://surveyplatform.com/survey/abc123?rid=USER123&source=email&age=25&return_url=http://localhost:5000/r/SESSION_ID_HERE
```

---

### 20. Survey Return Point (Simulate Survey Completion)
**GET** `/r/{sessionId}`

**No Authentication Required**

**Example URLs:**

**Complete:**
```
GET http://localhost:5000/r/65abc123def456789?status=complete
```

**Quota Full:**
```
GET http://localhost:5000/r/65abc123def456789?status=quota_full
```

**Terminate:**
```
GET http://localhost:5000/r/65abc123def456789?status=terminate
```

**Response:**
- **302 Redirect** to appropriate vendor URL based on status
- The system will redirect to vendor's complete/quotafull/terminate URL

---

### 21. Test Redirect Flow (Admin Only)
**GET** `/api/redirect/test/{vendorUuid}`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "vendorName": "Vendor B - Online Panel",
    "surveyName": "Product Feedback Survey 2024",
    "entryUrl": "http://localhost:5000/v/550e8400-e29b-41d4-a716-446655440002",
    "testUrls": {
      "entry": "http://localhost:5000/v/550e8400-e29b-41d4-a716-446655440002?param1=test&param2=value",
      "complete": "http://localhost:5000/r/[sessionId]?status=complete",
      "quotaFull": "http://localhost:5000/r/[sessionId]?status=quota_full",
      "terminate": "http://localhost:5000/r/[sessionId]?status=terminate"
    },
    "vendorEndpoints": {
      "complete": "https://vendorb.com/survey/complete?respondent={{RID}}&status=1",
      "quotaFull": "https://vendorb.com/survey/quotafull?respondent={{RID}}&status=2",
      "terminate": "https://vendorb.com/survey/terminate?respondent={{RID}}&status=3"
    }
  }
}
```

---

## 🧪 Testing Workflow in Postman

### Step 1: Initial Setup
1. **Register** - Create your admin account
2. **Login** - Get your authentication token
3. **Set Token** - In Postman, go to Authorization tab, select "Bearer Token", paste your token

### Step 2: Create Test Data
1. **Create Survey** - Use endpoint #7
2. **Add Vendor** - Use endpoint #13 (save the vendorUuid)
3. **Get Vendor URL** - Use endpoint #17

### Step 3: Test Redirect Flow
1. **Vendor Entry** - Use endpoint #19 with the vendorUuid
   - This simulates a vendor sending traffic
   - Note the sessionId in the redirect URL

2. **Survey Return** - Use endpoint #20 with the sessionId
   - Test with different status values
   - Verify redirect to correct vendor URL

### Step 4: Check Analytics
1. **Get Survey Stats** - Use endpoint #11
2. **Get Vendor Stats** - Use endpoint #18

---

## 📝 Postman Collection Setup

### Environment Variables (Recommended)
Create a Postman environment with these variables:

```
baseUrl: http://localhost:5000
token: (leave empty, will be set after login)
surveyId: (leave empty, will be set after creating survey)
vendorId: (leave empty, will be set after creating vendor)
vendorUuid: (leave empty, will be set after creating vendor)
sessionId: (leave empty, will be set after redirect)
```

### Pre-request Script for Login
Add this to the login request's "Tests" tab:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
}
```

### Authorization Setup
For all protected endpoints, in the Authorization tab:
- Type: Bearer Token
- Token: {{token}}

---

## 🚨 Common Error Responses

### 401 Unauthorized
```json
{
  "error": "Not authorized, no token"
}
```
**Solution:** Add Bearer token in Authorization header

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```
**Solution:** Check the ID in the URL

### 400 Bad Request
```json
{
  "error": "Validation error message here"
}
```
**Solution:** Check required fields in request body

### 500 Server Error
```json
{
  "success": false,
  "error": "Server Error"
}
```
**Solution:** Check server logs for details

---

## 🎯 Quick Test Sequence

1. **POST** `/api/auth/register` - Create admin account
2. **POST** `/api/auth/login` - Get token
3. **POST** `/api/surveys` - Create a survey
4. **POST** `/api/surveys/{surveyId}/vendors` - Add vendor
5. **GET** `/v/{vendorUuid}?rid=TEST123` - Test vendor entry
6. **GET** `/r/{sessionId}?status=complete` - Test survey return
7. **GET** `/api/surveys/{surveyId}/stats` - Check statistics

---

## 📌 Important Notes

1. **Always include the Bearer token** in Authorization header for protected endpoints
2. **Vendor UUIDs are auto-generated** when creating vendors
3. **Session IDs are created** during vendor entry redirect
4. **Status values** must be: `complete`, `quota_full`, or `terminate`
5. **Query parameters are preserved** through the entire redirect flow
6. **Port 5000** is used as configured in your .env file

---

**Testing Tip:** Create a Postman collection with all these requests, use environment variables for token and IDs, and you can easily test the entire flow!