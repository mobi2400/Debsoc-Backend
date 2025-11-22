# Deployment & CORS Configuration Guide

## ✅ CORS Added Successfully

Your backend now has CORS (Cross-Origin Resource Sharing) enabled, which means:
- ✅ Any frontend application can make requests to your API
- ✅ Works with React, Vue, Angular, or any web framework
- ✅ Works with mobile apps (React Native, Flutter, etc.)
- ✅ Works from any domain after deployment

## Current CORS Configuration

```typescript
app.use(cors({
  origin: '*', // Allows requests from ANY origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### What This Means:
- **`origin: '*'`** - Accepts requests from any domain
- **`methods`** - Allows all standard HTTP methods
- **`allowedHeaders`** - Accepts Content-Type and Authorization headers
- **`credentials: true`** - Allows cookies and authentication headers

## 🔒 Production CORS Configuration (Recommended)

For production, you should restrict CORS to specific domains for security:

### Option 1: Single Domain
```typescript
app.use(cors({
  origin: 'https://yourdomain.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### Option 2: Multiple Domains
```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'https://admin.yourdomain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### Option 3: Environment-Based (Best Practice)
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

Then in your `.env`:
```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 🚀 Deployment Checklist

### Before Deploying:

1. **Update CORS Configuration**
   - [ ] Replace `origin: '*'` with specific domains
   - [ ] Add allowed origins to environment variables

2. **Environment Variables**
   - [ ] Set `DATABASE_URL` for production database
   - [ ] Set `JWT_SECRET` (use a strong, random string)
   - [ ] Set `PORT` (if required by hosting platform)
   - [ ] Set `ALLOWED_ORIGINS` (comma-separated list)

3. **Database**
   - [ ] Run migrations: `npm run prisma:migrate`
   - [ ] Create TechHead account manually
   - [ ] Verify database connection

4. **Security**
   - [ ] Use HTTPS in production
   - [ ] Set strong JWT_SECRET
   - [ ] Enable rate limiting (optional but recommended)
   - [ ] Add helmet for security headers (optional)

5. **Build & Test**
   - [ ] Run `npm run build`
   - [ ] Test production build locally
   - [ ] Verify all endpoints work

## 📦 Deployment Platforms

### Render (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Build command: `npm install && npm run build`
4. Start command: `npm start`

### Railway
1. Connect your GitHub repository
2. Add environment variables
3. Railway auto-detects Node.js and builds automatically

### Heroku
1. Create Heroku app
2. Add Heroku Postgres addon
3. Set environment variables
4. Deploy via Git: `git push heroku main`

### Vercel (Serverless)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Configure environment variables
4. Note: May need serverless-friendly database

### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

## 🔧 Production Environment Variables

Create a `.env.production` file (don't commit this):

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Server
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛡️ Additional Security Recommendations

### 1. Add Helmet (Security Headers)
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 2. Add Rate Limiting
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Add Request Logging
```bash
npm install morgan
```

```typescript
import morgan from 'morgan';
app.use(morgan('combined'));
```

## 🧪 Testing CORS After Deployment

### From Browser Console:
```javascript
fetch('https://your-api-domain.com/api/president/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'test123'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### From Frontend (React Example):
```javascript
const response = await fetch('https://your-api-domain.com/api/president/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'president@debsoc.com',
    password: 'president123'
  })
});

const data = await response.json();
console.log(data);
```

## 📝 Deployment Commands

```bash
# Build the project
npm run build

# Run production build locally (for testing)
npm start

# Run migrations on production database
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Push schema to database (alternative to migrations)
npm run prisma:push
```

## ✅ Post-Deployment Verification

After deploying, test these endpoints:

1. **Health Check**
   ```
   GET https://your-api-domain.com/
   ```
   Should return: `{"message": "Debsoc Backend API", "version": "1.0.0"}`

2. **CORS Test**
   Open browser console on any website and run:
   ```javascript
   fetch('https://your-api-domain.com/api/president/register', {
     method: 'OPTIONS'
   }).then(res => console.log(res.headers.get('access-control-allow-origin')));
   ```
   Should return: `*` or your specific domain

3. **API Test**
   Test a public endpoint like register or login

## 🎯 Current Status

✅ **CORS Enabled** - Your API can now be accessed from:
- Any web application
- Any mobile application
- Postman/Insomnia
- Any frontend framework
- Any domain (after deployment)

⚠️ **Remember for Production:**
- Replace `origin: '*'` with specific domains
- Use environment variables for configuration
- Enable HTTPS
- Set strong JWT_SECRET
- Consider adding rate limiting

Your backend is now **deployment-ready** and can be accessed from anywhere! 🚀
