# Survey Redirect Layer - Development Guide

## Project Structure
```
survey-redirect-layer/
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── app.js         # Express app setup
│   ├── tests/             # Backend tests
│   ├── .env.example       # Environment variables template
│   ├── package.json       # Backend dependencies
│   └── server.js          # Entry point
│
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   ├── utils/         # Frontend utilities
│   │   ├── styles/        # CSS/styling
│   │   ├── App.js         # Main App component
│   │   └── index.js       # React entry point
│   ├── public/            # Static files
│   └── package.json       # Frontend dependencies
│
├── docs/                  # Documentation
├── docker-compose.yml     # Docker configuration
└── README.md             # Project overview
```

## Development Steps

### Phase 1: Backend Setup

#### 1.1 Initialize Backend Project
```bash
cd server
npm init -y
npm install express mongoose cors helmet morgan compression dotenv
npm install jsonwebtoken bcryptjs express-validator uuid
npm install --save-dev nodemon jest supertest
```

#### 1.2 Database Schema Design

**Users Collection**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String ('admin', 'viewer'),
  createdAt: Date,
  lastLogin: Date
}
```

**Surveys Collection**
```javascript
{
  _id: ObjectId,
  name: String,
  clientUrl: String,
  isActive: Boolean,
  createdBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

**Vendors Collection**
```javascript
{
  _id: ObjectId,
  surveyId: ObjectId (ref: Surveys),
  name: String,
  vendorUuid: String (unique),
  entryUrl: String,
  completeUrl: String,
  quotaFullUrl: String,
  terminateUrl: String,
  isActive: Boolean,
  createdAt: Date
}
```

**Sessions Collection**
```javascript
{
  _id: ObjectId,
  sessionId: String (unique),
  vendorId: ObjectId (ref: Vendors),
  surveyId: ObjectId (ref: Surveys),
  queryParams: Object,
  status: String ('active', 'complete', 'quota_full', 'terminate'),
  createdAt: Date,
  completedAt: Date
}
```

**Analytics Collection**
```javascript
{
  _id: ObjectId,
  surveyId: ObjectId,
  vendorId: ObjectId,
  sessionId: String,
  eventType: String ('entry', 'exit'),
  status: String,
  timestamp: Date,
  responseTime: Number
}
```

### Phase 2: API Endpoints

#### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

#### Survey Management
- `GET /api/surveys` - List all surveys
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/:id` - Get survey details
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey

#### Vendor Management
- `GET /api/surveys/:surveyId/vendors` - List vendors for survey
- `POST /api/surveys/:surveyId/vendors` - Add vendor to survey
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Remove vendor
- `GET /api/vendors/:id/url` - Generate vendor entry URL

#### Redirect Endpoints (Public)
- `GET /v/:vendorUuid` - Vendor entry point
- `GET /r/:sessionId` - Survey return point

#### Analytics Endpoints
- `GET /api/analytics/summary` - Overall metrics
- `GET /api/analytics/survey/:id` - Survey-specific metrics
- `GET /api/analytics/vendor/:id` - Vendor-specific metrics

### Phase 3: Frontend Development

#### 3.1 Initialize React Project
```bash
cd client
npx create-react-app . --template typescript
npm install react-router-dom axios recharts
npm install @mui/material @emotion/react @emotion/styled
```

#### 3.2 Component Structure
- **Layout Components**
  - Header
  - Sidebar
  - Footer

- **Authentication**
  - LoginPage
  - ProtectedRoute

- **Dashboard**
  - DashboardHome
  - MetricsChart
  - RecentActivity

- **Survey Management**
  - SurveyList
  - SurveyForm
  - SurveyDetail

- **Vendor Management**
  - VendorList
  - VendorForm
  - URLGenerator

### Phase 4: Core Redirect Logic

```javascript
// Vendor Entry Handler
async function handleVendorEntry(req, res) {
  const { vendorUuid } = req.params;
  const queryParams = req.query;

  // 1. Find vendor and survey
  const vendor = await Vendor.findOne({ vendorUuid, isActive: true });
  if (!vendor) return res.status(404).send('Invalid vendor');

  // 2. Create session
  const session = await Session.create({
    sessionId: generateUuid(),
    vendorId: vendor._id,
    surveyId: vendor.surveyId,
    queryParams,
    status: 'active'
  });

  // 3. Get survey URL
  const survey = await Survey.findById(vendor.surveyId);

  // 4. Build redirect URL with params
  const redirectUrl = buildUrlWithParams(survey.clientUrl, {
    ...queryParams,
    return_url: `${BASE_URL}/r/${session.sessionId}`
  });

  // 5. Log analytics
  await logAnalytics('entry', session);

  // 6. Redirect
  res.redirect(redirectUrl);
}

// Survey Return Handler
async function handleSurveyReturn(req, res) {
  const { sessionId } = req.params;
  const { status } = req.query;

  // 1. Find session
  const session = await Session.findOne({ sessionId });
  if (!session) return res.status(404).send('Session not found');

  // 2. Get vendor
  const vendor = await Vendor.findById(session.vendorId);

  // 3. Determine redirect URL based on status
  let redirectUrl;
  switch(status?.toLowerCase()) {
    case 'complete':
      redirectUrl = vendor.completeUrl;
      break;
    case 'quota_full':
      redirectUrl = vendor.quotaFullUrl;
      break;
    case 'terminate':
      redirectUrl = vendor.terminateUrl;
      break;
    default:
      redirectUrl = vendor.terminateUrl;
  }

  // 4. Update session
  session.status = status;
  session.completedAt = new Date();
  await session.save();

  // 5. Log analytics
  await logAnalytics('exit', session, status);

  // 6. Redirect with original params
  res.redirect(buildUrlWithParams(redirectUrl, session.queryParams));
}
```

## Testing Strategy

### Backend Testing
- Unit tests for services and utilities
- Integration tests for API endpoints
- Load testing for redirect performance
- Security testing for authentication

### Frontend Testing
- Component testing with React Testing Library
- E2E testing with Cypress
- Performance testing with Lighthouse

## Deployment Considerations

### Environment Variables
```env
# Server
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/survey_redirect
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000

# Client
REACT_APP_API_URL=http://localhost:3001/api
```

### Docker Configuration
- Containerize backend and frontend
- Use docker-compose for local development
- Implement health checks
- Configure networking between containers

### Production Deployment
- Use PM2 for Node.js process management
- Implement Nginx as reverse proxy
- Set up SSL certificates
- Configure monitoring and logging
- Implement backup strategies

## Performance Optimization
- Implement caching for vendor configurations
- Use database indexes on frequently queried fields
- Optimize React bundle size
- Implement lazy loading for dashboard components
- Use CDN for static assets

## Security Best Practices
- Implement rate limiting on all endpoints
- Use helmet.js for security headers
- Sanitize all user inputs
- Implement CSRF protection
- Regular security audits
- Secure session management
- Environment-based configuration