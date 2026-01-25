<!-- # Survey Redirect Layer - System Architecture

## Overview
A dynamic survey redirect system that manages multiple surveys with multiple vendors, providing invisible routing between vendor entry points and survey completion endpoints while maintaining complete parameter passthrough and tracking.

## System Components

### 1. Backend API (Node.js + Express)
- **Purpose**: Handle redirect logic, vendor management, and API endpoints
- **Tech Stack**: Node.js, Express, MongoDB, JWT authentication
- **Key Features**:
  - Dynamic vendor routing based on session tracking
  - <200ms response time for redirects
  - Full parameter passthrough
  - RESTful API for dashboard operations

### 2. Database (MongoDB)
- **Collections/Tables**:
  - Users (admin accounts)
  - Surveys (survey configurations)
  - Vendors (vendor details and URLs)
  - Sessions (active redirect sessions)
  - Analytics (redirect metrics and logs)

### 3. Frontend Dashboard (React)
- **Purpose**: Admin interface for survey and vendor management
- **Features**:
  - Login/authentication
  - Survey CRUD operations
  - Vendor management per survey
  - Real-time metrics dashboard
  - URL generator for vendors

### 4. Redirect Engine
- **Purpose**: Core routing logic
- **Features**:
  - Vendor identification via unique landing URLs
  - Status code detection (Complete, Quota Full, Terminate)
  - Conditional routing based on vendor origin
  - Parameter preservation

## System Flow

### Respondent Journey
```
1. Vendor A sends respondent to: https://redirect.domain/v/[vendor_uuid]?param1=x&param2=y
2. System identifies Vendor A, creates session, redirects to client survey with params
3. Client survey completes with status: https://redirect.domain/r/[session_id]?status=Complete
4. System looks up session, finds Vendor A, redirects to Vendor A's complete URL
```

### Data Flow
```
Vendor Entry → Session Creation → Client Survey → Status Return → Vendor Exit
     ↓              ↓                               ↓              ↓
  Analytics      Database                      Analytics      Database
```

## Security Considerations
- JWT-based authentication for admin access
- UUID-based vendor identification (no predictable patterns)
- Session-based tracking (no vendor info in client URLs)
- Rate limiting on all endpoints
- CORS configuration for dashboard access
- Environment-based configuration for sensitive data

## Scalability Features
- Stateless redirect handlers
- Database indexing on frequently queried fields
- Caching layer for vendor configurations
- Horizontal scaling capability
- Load balancer ready architecture

## Performance Requirements
- <200ms redirect response time
- Support for 10,000+ concurrent sessions
- 99.9% uptime target
- Real-time metrics updates (5-second intervals)

## Technology Stack Summary
- **Backend**: Node.js 18+, Express 4.x
- **Database**: MongoDB
- **Frontend**: React 18+, React Router, Axios
- **Authentication**: JWT, bcrypt
- **Monitoring**: Winston logging, custom analytics -->


# Survey Redirect System
## System Architecture


```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Admin Users                    Survey Respondents              │
│  (Dashboard Access)             (Vendor Traffic)                │
│       ↓                              ↓                          │
│  Web Browser                    Web Browser                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Landing Page         Admin Dashboard        Status Pages       │
│  (Login)              (Management UI)        (4 Pages)          │
│                                                                 │
│  • Public Access      • Survey Management    • Complete         │
│  • Authentication     • Vendor Management    • Terminate        │
│                       • Analytics View       • Quota Full       │
│                       • URL Generation       • Security         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Node.js + Express Server                                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Authentication Module                                   │  │
│  │  - Login/Logout                                          │  │
│  │  - Session Management                                    │  │
│  │  - JWT Token Generation                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redirect Engine                                         │  │
│  │  - Vendor Entry Routing                                  │  │
│  │  - Tracking ID Generation                                │  │
│  │  - Survey Forwarding                                     │  │
│  │  - Exit Callback Processing                              │  │
│  │  - Vendor URL Construction                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Survey Management Module                                │  │
│  │  - Create/Edit/Delete Surveys                            │  │
│  │  - Survey URL Configuration                              │  │
│  │  - Survey Status Control                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Vendor Management Module                                │  │
│  │  - Add/Edit/Delete Vendors                               │  │
│  │  - URL Template Configuration                            │  │
│  │  - Entry URL Generation                                  │  │
│  │  - Vendor-Survey Association                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Analytics Module                                        │  │
│  │  - Traffic Counting                                      │  │
│  │  - Status Breakdown                                      │  │
│  │  - Vendor Comparison                                     │  │
│  │  - Performance Metrics                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Status Pages Module                                     │  │
│  │  - Custom Message Display                                │  │
│  │  - Auto-Redirect Logic                                   │  │
│  │  - Page Configuration                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MongoDB Database                                               │
│                                                                 │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐  │
│  │   Users      │   Surveys    │   Vendors    │  Redirects  │  │
│  │  Collection  │  Collection  │  Collection  │ Collection  │  │
│  └──────────────┴──────────────┴──────────────┴─────────────┘  │
│  ┌──────────────┐                                               │
│  │Status Pages  │                                               │
│  │  Collection  │                                               │
│  └──────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Components

### 1. Presentation Layer

**Landing Page**
- Login interface
- Authentication form
- System branding

**Admin Dashboard**
- Survey list and management
- Vendor configuration
- Analytics display
- URL generation
- Status page setup

**Status Pages (4 Types)**
- Complete (success message)
- Terminate (screened out)
- Quota Full (survey full)
- Security (session expired)

---

### 2. Application Layer

**Authentication Module**
- User login/logout
- Password encryption
- JWT tokens
- Session validation

**Redirect Engine**
Entry Processing:
- Capture vendor traffic
- Extract survey and vendor IDs
- Generate tracking ID
- Store tracking data
- Preserve parameters
- Redirect to survey

Exit Processing:
- Receive survey callback
- Read status code
- Lookup tracking ID
- Identify vendor
- Build return URL
- Show status page or redirect

**Survey Management**
- Create surveys
- Edit details
- Configure URLs
- Control status
- View statistics

**Vendor Management**
- Add vendors to surveys
- Configure parameters
- Set return URLs
- Generate entry URLs
- Edit configurations
- View performance

**Analytics**
- Traffic counting
- Status breakdown
- Vendor comparison
- Performance tracking
- Date filtering
- CSV export

**Status Pages**
- Custom messages
- Auto-redirect
- Countdown timers
- Enable/disable control

---

### 3. Data Layer

**Users Collection**
- Admin accounts
- Credentials
- Login history

**Surveys Collection**
- Survey details
- URLs
- Status
- Statistics
- Settings

**Vendors Collection**
- Vendor info per survey
- Parameters
- URL templates
- Performance data

**Redirects Collection**
- Tracking records
- Timestamps
- Status outcomes
- URL trails
- Metrics

**Status Pages Collection**
- Custom content
- Titles and messages
- Redirect delays
- Configuration flags

---

## Data Flow

### Flow 1: Admin Setup

```
Login
    ↓
Dashboard → Create Survey
    ↓
Enter Details
    ↓
Save to Database
    ↓
Add Vendors
    ↓
Configure URLs
    ↓
System Generates Entry URLs
    ↓
Copy and Share with Vendors
```

### Flow 2: Respondent Entry

```
Vendor Sends Traffic
    ↓
/r/{survey_id}/{vendor_id}?param=value
    ↓
Redirect Engine Captures
    ↓
Extract IDs and Parameters
    ↓
Generate Tracking ID
    ↓
Lookup Survey Details
    ↓
Store Tracking Data
    ↓
Build Survey URL
    ↓
Redirect (< 200ms)
```

### Flow 3: Respondent Exit

```
Survey Complete
    ↓
/exit/{survey_id}?status=X&tracking_id=Y
    ↓
Extract Status and Tracking ID
    ↓
Lookup Tracking Record
    ↓
Identify Vendor
    ↓
Get Vendor URLs
    ↓
Select URL by Status
    ↓
Replace Placeholders
    ↓
Update Record
    ↓
Show Status Page or Redirect (< 200ms)
```

### Flow 4: View Analytics

```
Login → Analytics
    ↓
Query Database
    ↓
Aggregate Data
    ↓
Calculate Metrics
    ↓
Display Charts
```

---

## Scalability

### Multi-Survey Support
Each survey is independent with its own vendor configuration. No limit on number of surveys.

### Dynamic Vendor Assignment
Vendors assigned per survey. Same vendor can work across multiple surveys with different configurations.

### Scaling Example

```
Start: 1 survey, 2 vendors
    ↓
Grow: 5 surveys, 3-10 vendors each
    ↓
Scale: 20+ surveys, 50+ unique vendors

System handles any scale without code changes
```

---

## Technology Stack

**Frontend**
- HTML5, CSS3, JavaScript
- Responsive design
- AJAX updates
- Chart visualization

**Backend**
- Node.js
- Express.js
- JWT authentication
- bcrypt encryption

**Database**
- MongoDB
- Mongoose ODM

**Optional**
- Redis (caching)
- Nginx (proxy)
- PM2 (process management)

---

## Security

**Authentication**
- Secure login
- Password hashing
- JWT sessions
- Token expiration

**Protection**
- HTTPS/SSL
- Input sanitization
- XSS prevention
- CSRF protection

**Access Control**
- Admin dashboard protected
- Public redirect endpoints
- Role-based permissions

---

## Performance

**Speed**
- Target: <200ms redirects
- In-memory caching
- Database indexing
- Async operations

**Scalability**
- Horizontal scaling
- Load balancing
- Connection pooling
- Stateless design

---

## URL Structure

**Dashboard URLs**
```
/                           Login
/dashboard                  Home
/surveys                    Survey list
/surveys/new                Create
/surveys/{id}               Detail
/analytics                  Analytics
```

**Redirect URLs**
```
/r/{survey_id}/{vendor_id}  Entry point
/exit/{survey_id}           Exit callback
/status/complete            Complete page
/status/terminate           Terminate page
/status/quota               Quota page
/status/security            Security page
```

---

## Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Nginx                                                   │  │
│  │  - SSL/HTTPS                                             │  │
│  │  - Load Balancing                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js App (PM2)                                       │  │
│  │  - Port 3000                                             │  │
│  │  - Auto-restart                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MongoDB                                                 │  │
│  │  - Port 27017                                            │  │
│  │  - Backups enabled                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Server Requirements

**Hardware**
- OS: Ubuntu 20.04+ / CentOS 8+
- RAM: 2GB minimum (4GB recommended)
- CPU: 2 cores minimum
- Storage: 20GB+

**Software**
- Node.js 14+ or 16+
- MongoDB 4.4+ or 5.0+

**Network**
- Domain with DNS
- SSL certificate
- Ports: 80, 443 (external)
- Ports: 3000, 27017 (internal)

---

## Monitoring

**Health Checks**
- Uptime tracking
- Response times
- Database status
- Error logging

**Data Management**
- Retention policies
- Periodic cleanup
- Daily backups
- Log rotation

**Metrics**
- Average redirect time
- Peak traffic
- Error rates
- Resource usage