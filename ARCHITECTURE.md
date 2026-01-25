# Survey Redirect System
## System Architecture Document

---

## High-Level Architecture

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
│  │  • Login/Logout                                          │  │
│  │  • Session Management                                    │  │
│  │  • JWT Token Generation                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redirect Engine                                         │  │
│  │  • Vendor Entry Routing                                  │  │
│  │  • Tracking ID Generation                                │  │
│  │  • Survey Forwarding                                     │  │
│  │  • Exit Callback Processing                              │  │
│  │  • Vendor URL Construction                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Survey Management Module                                │  │
│  │  • Create/Edit/Delete Surveys                            │  │
│  │  • Survey URL Configuration                              │  │
│  │  • Survey Status Control                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Vendor Management Module                                │  │
│  │  • Add/Edit/Delete Vendors                               │  │
│  │  • URL Template Configuration                            │  │
│  │  • Entry URL Generation                                  │  │
│  │  • Vendor-Survey Association                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Analytics Module                                        │  │
│  │  • Traffic Counting                                      │  │
│  │  • Status Breakdown                                      │  │
│  │  • Vendor Comparison                                     │  │
│  │  • Performance Metrics                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Status Pages Module                                     │  │
│  │  • Custom Message Display                                │  │
│  │  • Auto-Redirect Logic                                   │  │
│  │  • Page Configuration                                    │  │
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

#### Landing Page
- Public-facing login page
- Authentication interface
- Branding and system information

#### Admin Dashboard
- Survey list and management
- Vendor configuration interface
- Analytics visualization
- URL generation and copying
- Status page customization

#### Status Pages (4 Types)
- Complete page (success message)
- Terminate page (screened out)
- Quota Full page (survey full)
- Security page (session expired)
- Each with auto-redirect functionality

---

### 2. Application Layer

#### Authentication Module
- User login/logout
- Password encryption
- JWT token generation
- Session validation
- Role-based access control

#### Redirect Engine (Core System)
- **Entry Processing:**
  - Captures vendor traffic
  - Extracts survey_id and vendor_id from URL
  - Generates unique tracking_id
  - Stores tracking data in database
  - Preserves all query parameters
  - Redirects to survey URL

- **Exit Processing:**
  - Receives survey completion callback
  - Reads status code (1-4)
  - Looks up tracking_id in database
  - Identifies original vendor
  - Constructs vendor return URL
  - Either shows status page or redirects directly

#### Survey Management Module
- Create new surveys
- Edit survey details
- Configure survey URLs
- Pause/resume surveys
- Delete surveys
- View survey statistics

#### Vendor Management Module
- Add vendors to surveys
- Configure entry parameters
- Set up vendor return URLs
- Generate unique entry URLs
- Edit vendor configuration
- Remove vendors from surveys
- View vendor performance

#### Analytics Module
- Real-time traffic counting
- Status breakdown (complete/terminate/quota/security)
- Vendor comparison metrics
- Survey performance tracking
- Response time monitoring
- Date range filtering
- Data export (CSV)

#### Status Pages Module
- Display custom messages per status
- Auto-redirect with countdown
- Configurable redirect delays
- Custom HTML support (optional)
- Enable/disable per survey

---

### 3. Data Layer

#### Users Collection
- Admin account information
- Email and hashed passwords
- Last login tracking
- Role assignments

#### Surveys Collection
- Survey identifiers and names
- Survey URLs
- Status (active/paused/completed)
- Creation metadata
- Total redirect counts
- Settings (status pages, delays)

#### Vendors Collection
- Vendor details per survey
- Entry parameter configuration
- URL templates (complete, terminate, quota, security)
- Vendor statistics
- Status tracking

#### Redirects Collection
- Tracking IDs
- Survey and vendor associations
- Respondent IDs
- Entry and exit timestamps
- Status outcomes
- Complete URL trails
- Performance metrics

#### Status Pages Collection
- Custom messages per status
- Page titles and content
- Redirect delay settings
- Enable/disable flags
- Survey-specific configurations

---

## Data Flow Architecture

### Flow 1: Admin Creates Survey with Vendors

```
Admin Login
    ↓
Dashboard → Create Survey
    ↓
Enter Survey Details
    ↓
Save to Database (Surveys Collection)
    ↓
Add Vendors
    ↓
Configure Vendor URLs
    ↓
Save to Database (Vendors Collection)
    ↓
System Generates Entry URLs
    ↓
Admin Copies URLs
    ↓
Admin Shares URLs with Vendors
```

### Flow 2: Respondent Entry (Vendor → Survey)

```
Vendor Sends Traffic
    ↓
URL: /r/{survey_id}/{vendor_id}?{param}={value}
    ↓
Redirect Engine Captures Request
    ↓
Extract: survey_id, vendor_id, parameters
    ↓
Generate: unique tracking_id
    ↓
Database Lookup: Get survey details
    ↓
Database Lookup: Get vendor configuration
    ↓
Store Tracking Data (Redirects Collection)
    ↓
Build Survey URL: survey_url + parameters + tracking_id
    ↓
302 Redirect to Survey (Response Time: <200ms)
```

### Flow 3: Respondent Exit (Survey → Vendor)

```
Survey Completes
    ↓
Survey Fires: /exit/{survey_id}?status={code}&tracking_id={id}
    ↓
Redirect Engine Captures Request
    ↓
Extract: survey_id, status, tracking_id, parameters
    ↓
Database Lookup: Find tracking record
    ↓
Identify: Original vendor_id
    ↓
Database Lookup: Get vendor return URLs
    ↓
Select URL Based on Status (1=complete, 2=term, 3=quota, 4=security)
    ↓
Replace Placeholders: {{TOID}} → actual value
    ↓
Update Tracking Record: exit_time, final_url
    ↓
Check: Status pages enabled?
    ↓
If Yes → Show Status Page → Auto-redirect after delay
If No → 302 Redirect to Vendor (Response Time: <200ms)
```

### Flow 4: Admin Views Analytics

```
Admin Login
    ↓
Navigate to Analytics
    ↓
Database Query: Redirects Collection
    ↓
Aggregate Data:
  - Total redirects
  - Status breakdown
  - Vendor comparison
  - Survey performance
    ↓
Calculate Metrics:
  - Completion rates
  - Response times
  - Traffic distribution
    ↓
Render Dashboard with Charts
```

---

## Scalability Architecture

### Multi-Survey Support
- Each survey is independent
- Surveys share the same system infrastructure
- No limit on number of surveys
- Isolated tracking per survey

### Dynamic Vendor Assignment
- Vendors are associated with specific surveys
- Same vendor can be used across multiple surveys
- Different vendor configurations per survey
- No hardcoded vendor limits

### Example Scaling Scenarios

```
Scenario 1: Client starts with 1 survey, 2 vendors
Survey A: Vendor1, Vendor2

Scenario 2: Client adds more surveys
Survey A: Vendor1, Vendor2
Survey B: Vendor3, Vendor4, Vendor5
Survey C: Vendor1, Vendor6

Scenario 3: Client scales to many surveys
Survey 1-10: Each with 2-15 vendors
Survey 11-20: Each with different vendor combinations
Total: 20 surveys, 50+ unique vendors

System handles all scenarios identically - no code changes needed
```

---

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript
- Responsive design (mobile-friendly)
- AJAX for dynamic updates
- Chart libraries for analytics visualization

### Backend
- Node.js (Runtime)
- Express.js (Web framework)
- JWT (Authentication)
- bcrypt (Password hashing)

### Database
- MongoDB (Primary database)
- Mongoose (ODM - Object Data Modeling)

### Optional Enhancements
- Redis (Caching for faster lookups)
- Nginx (Reverse proxy, load balancing)
- PM2 (Process management)

---

## Security Architecture

### Authentication Layer
- Secure login with email/password
- Password hashing (bcrypt)
- JWT token-based sessions
- Token expiration and refresh
- Logout functionality

### Data Protection
- HTTPS/SSL encryption (all traffic)
- Password strength requirements
- SQL injection prevention (MongoDB parameterized queries)
- XSS protection (input sanitization)
- CSRF protection

### Access Control
- Admin-only dashboard access
- Public redirect endpoints (no auth needed)
- Role-based permissions (future: multi-user support)

---

## Performance Architecture

### Speed Optimization
- Target: <200ms redirect time
- In-memory caching (frequently accessed data)
- Database indexing (survey_id, vendor_id, tracking_id)
- Minimal database queries per redirect
- Async/await for non-blocking operations

### Scalability
- Horizontal scaling (multiple server instances)
- Load balancing (distribute traffic)
- Database connection pooling
- Stateless application design

---

## URL Structure

### Admin Dashboard URLs
```
/                           → Landing page (login)
/dashboard                  → Dashboard home
/surveys                    → Survey list
/surveys/new                → Create survey
/surveys/{id}               → Survey detail
/surveys/{id}/edit          → Edit survey
/vendors/{survey_id}/new    → Add vendor
/vendors/{id}/edit          → Edit vendor
/analytics                  → Analytics dashboard
/settings                   → System settings
```

### Public Redirect URLs
```
/r/{survey_id}/{vendor_id}  → Vendor entry point
/exit/{survey_id}           → Survey exit callback
/status/complete            → Complete status page
/status/terminate           → Terminate status page
/status/quota               → Quota full status page
/status/security            → Security status page
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION SERVER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Domain: yourserver.com                                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)                                   │  │
│  │  • SSL/HTTPS Termination                                 │  │
│  │  • Load Balancing                                        │  │
│  │  • Static File Serving                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js Application (PM2)                               │  │
│  │  • Port: 3000                                            │  │
│  │  • Auto-restart on crash                                 │  │
│  │  • Load balancing (cluster mode)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MongoDB Database                                        │  │
│  │  • Port: 27017 (internal only)                           │  │
│  │  • Automated backups                                     │  │
│  │  • Indexed collections                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Requirements

### Server Requirements
- Operating System: Ubuntu 20.04+ / CentOS 8+ / Windows Server
- RAM: Minimum 2GB (4GB recommended)
- CPU: 2 cores minimum
- Storage: 20GB minimum (grows with redirect data)
- Node.js: Version 14+ or 16+ (LTS)
- MongoDB: Version 4.4+ or 5.0+

### Network Requirements
- Domain name with DNS access
- SSL certificate (Let's Encrypt or purchased)
- Port 80 (HTTP) and 443 (HTTPS) open
- Port 3000 (internal for Node.js)
- Port 27017 (internal for MongoDB)

---

## Monitoring & Maintenance

### Health Monitoring
- System uptime tracking
- Response time monitoring
- Database connection status
- Error logging
- Traffic volume tracking

### Data Management
- Automatic data retention policies
- Periodic database cleanup (old tracking records)
- Database backups (daily recommended)
- Log rotation

### Performance Metrics
- Average redirect time
- Peak traffic handling
- Error rates
- Database query performance
- Memory and CPU usage

---

## Future Expansion Capabilities

### Phase 1 (Current)
- Single admin account
- Unlimited surveys
- Unlimited vendors per survey
- Basic analytics
- Status pages
