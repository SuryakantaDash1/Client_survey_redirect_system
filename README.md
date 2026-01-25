# Survey Redirect Layer System

A dynamic survey redirect system that manages multiple surveys with multiple vendors, providing invisible routing between vendor entry points and survey completion endpoints.

## Features

- **Dynamic Vendor Management**: Add unlimited vendors per survey
- **Invisible Routing**: Respondents are routed seamlessly without seeing client URLs
- **Full Parameter Passthrough**: All query parameters are preserved throughout the redirect flow
- **<200ms Response Time**: Optimized for minimal latency
- **Real-time Analytics**: Track sessions, completion rates, and vendor performance
- **Admin Dashboard**: Web interface for managing surveys and vendors
- **Secure Authentication**: JWT-based authentication system
- **Scalable Architecture**: Built with Node.js and React for horizontal scaling

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+ or PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd survey-redirect-layer
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

4. Set up environment variables:
```bash
cd ../server
cp .env.example .env
# Edit .env with your configuration
```

5. Start MongoDB (if using MongoDB):
```bash
mongod
```

6. Run the backend server:
```bash
npm run dev
```

7. In a new terminal, start the frontend:
```bash
cd ../client
npm start
```

8. Access the application at `http://localhost:3000`

## Default Login

For first-time setup, you'll need to register an admin account:

1. Use the API to create the first admin user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword",
    "name": "Admin User"
  }'
```

2. Login at `http://localhost:3000/login`

## System Architecture

### Redirect Flow

1. **Vendor Entry**: Vendor sends respondent to `https://yourdomain.com/v/[vendor_uuid]`
2. **Session Creation**: System creates session and redirects to client survey
3. **Survey Completion**: Client survey returns to `https://yourdomain.com/r/[session_id]?status=[status]`
4. **Vendor Return**: System redirects to appropriate vendor URL based on status

### Status Codes

- `complete`: Survey completed successfully
- `quota_full`: Quota has been reached
- `terminate`: Respondent terminated/screened out

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Surveys
- `GET /api/surveys` - List all surveys
- `POST /api/surveys` - Create survey
- `GET /api/surveys/:id` - Get survey details
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `GET /api/surveys/:id/stats` - Get survey statistics

### Vendors
- `GET /api/surveys/:surveyId/vendors` - List vendors for survey
- `POST /api/surveys/:surveyId/vendors` - Add vendor to survey
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `GET /api/vendors/:id/url` - Get vendor entry URL

### Public Redirect Endpoints
- `GET /v/:vendorUuid` - Vendor entry point (no auth required)
- `GET /r/:sessionId` - Survey return point (no auth required)

## Production Deployment

### Using Docker

1. Build the Docker images:
```bash
docker-compose build
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Manual Deployment

1. Build the frontend:
```bash
cd client
npm run build
```

2. Set production environment variables:
```bash
cd ../server
# Edit .env for production settings
NODE_ENV=production
```

3. Start with PM2:
```bash
npm install -g pm2
pm2 start server.js --name survey-redirect
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Redirect endpoints
    location ~ ^/(v|r)/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, random JWT secret in production
3. **HTTPS**: Always use SSL certificates in production
4. **Rate Limiting**: Configure appropriate rate limits
5. **CORS**: Restrict CORS origins in production
6. **Database Security**: Use connection strings with authentication

## Performance Optimization

- Enable MongoDB indexes (automatically created by models)
- Use Redis for session caching (optional)
- Implement CDN for static assets
- Enable gzip compression
- Use PM2 cluster mode for multiple CPU cores

## Monitoring

- Application logs: Check PM2 logs with `pm2 logs`
- MongoDB monitoring: Use MongoDB Compass or Atlas
- Performance monitoring: Integrate with services like New Relic or Datadog

## Troubleshooting

### Common Issues

1. **Port already in use**: Change ports in `.env` file
2. **MongoDB connection failed**: Ensure MongoDB is running
3. **CORS errors**: Check CORS_ORIGIN in `.env`
4. **Authentication issues**: Verify JWT_SECRET is consistent

### Support

For issues and questions:
- Check the `/docs` folder for detailed documentation
- Review the system architecture in `SYSTEM_ARCHITECTURE.md`
- Follow the development guide in `DEVELOPMENT_GUIDE.md`

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request