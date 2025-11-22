# 🎭 Debsoc Backend

A comprehensive backend API for managing Debating Society operations, including user management, session tracking, task assignment, and anonymous feedback systems.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-lightgrey)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748)](https://www.prisma.io/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## ✨ Features

### Role-Based Access Control
- **TechHead**: System administrator with user verification capabilities
- **President**: Society leader with task assignment and management powers
- **Cabinet**: Administrative members with attendance tracking and feedback abilities
- **Member**: Regular members with task and attendance viewing capabilities

### Core Functionality
- ✅ User registration and authentication (JWT-based)
- ✅ Role-based authorization with verification system
- ✅ Task assignment and tracking
- ✅ Session attendance management
- ✅ Anonymous messaging to President
- ✅ Anonymous feedback system for members
- ✅ Session reports and analytics
- ✅ Dashboard data for Presidents
- ✅ CORS enabled for cross-origin requests

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **TypeScript** | Type-safe development |
| **Express.js** | Web framework |
| **Prisma 7** | Modern ORM with PostgreSQL adapter |
| **PostgreSQL** | Primary database |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **CORS** | Cross-origin resource sharing |

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mobi2400/Debsoc-Backend.git
   cd Debsoc-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/debsoc"
   JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
   PORT=3000
   NODE_ENV=development
   ```

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Create TechHead account** (manual database insert required)
   ```javascript
   // Generate password hash
   const bcrypt = require('bcryptjs');
   const hash = await bcrypt.hash('your-password', 10);
   console.log(hash);
   ```
   
   ```sql
   INSERT INTO "TechHead" (id, name, email, password, "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid(),
     'Tech Admin',
     'techhead@debsoc.com',
     '<paste_hashed_password_here>',
     NOW(),
     NOW()
   );
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

Server will be running at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### TechHead Routes (`/api/techhead`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | Public | Login TechHead |
| POST | `/verify/president` | TechHead | Verify President account |
| POST | `/verify/cabinet` | TechHead | Verify Cabinet account |
| POST | `/verify/member` | TechHead | Verify Member account |
| GET | `/unverified-users` | TechHead | Get all unverified users |

#### President Routes (`/api/president`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new President |
| POST | `/login` | Public | Login President |
| POST | `/tasks/assign` | President (Verified) | Assign task to Cabinet/Member |
| POST | `/feedback/give` | President (Verified) | Give feedback to Member |
| GET | `/sessions` | President (Verified) | Get session reports |
| GET | `/dashboard` | President (Verified) | Get dashboard data |

#### Cabinet Routes (`/api/cabinet`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new Cabinet member |
| POST | `/login` | Public | Login Cabinet member |
| POST | `/attendance/mark` | Cabinet (Verified) | Mark session attendance |
| GET | `/tasks` | Cabinet (Verified) | Get assigned tasks |
| POST | `/feedback/give` | Cabinet (Verified) | Give feedback to Member |
| GET | `/sessions` | Cabinet (Verified) | Get session reports |
| POST | `/messages/president` | Cabinet (Verified) | Send anonymous message to President |

#### Member Routes (`/api/member`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new Member |
| POST | `/login` | Public | Login Member |
| GET | `/attendance` | Member (Verified) | Get own attendance records |
| GET | `/tasks` | Member (Verified) | Get assigned tasks |
| POST | `/messages/president` | Member (Verified) | Send anonymous message to President |
| GET | `/feedback` | Member (Verified) | Get received feedback |

### Example Requests

#### Register President
```bash
curl -X POST http://localhost:3000/api/president/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "president@debsoc.com",
    "password": "securepassword123"
  }'
```

#### Login and Get Token
```bash
curl -X POST http://localhost:3000/api/president/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "president@debsoc.com",
    "password": "securepassword123"
  }'
```

#### Assign Task (Authenticated)
```bash
curl -X POST http://localhost:3000/api/president/tasks/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Prepare debate motion",
    "description": "Research and prepare motion for next session",
    "deadline": "2025-11-30T18:00:00Z",
    "assignedToMemberId": "<member-id>"
  }'
```

## 📁 Project Structure

```
Debsoc-Backend/
├── src/
│   ├── controllers/           # Business logic
│   │   ├── techHead.controller.ts
│   │   ├── president.controller.ts
│   │   ├── cabinet.controller.ts
│   │   └── member.controller.ts
│   ├── routes/               # API route definitions
│   │   ├── techHead.routes.ts
│   │   ├── president.routes.ts
│   │   ├── cabinet.routes.ts
│   │   └── member.routes.ts
│   ├── middleware/           # Custom middleware
│   │   └── auth.middleware.ts
│   ├── types/               # TypeScript type definitions
│   │   └── express.d.ts
│   ├── lib/                 # Utilities
│   │   └── prisma.ts
│   ├── prisma/              # Database
│   │   └── schema.prisma
│   ├── prisma.config.ts     # Prisma configuration
│   └── index.ts             # Application entry point
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
├── AI_RULES.md              # AI development guidelines
├── API_TESTING_GUIDE.md     # Testing instructions
├── DEPLOYMENT_GUIDE.md      # Deployment instructions
├── CODEBASE_ANALYSIS.md     # Architecture documentation
└── Debsoc_API_Collection.postman_collection.json
```

## 🗄️ Database Schema

### Models

- **TechHead**: System administrators
- **President**: Society presidents
- **Cabinet**: Cabinet members
- **Member**: Regular members
- **Session**: Debate/meeting sessions
- **Attendance**: Member attendance records
- **Task**: Assigned tasks
- **AnonymousMessage**: Anonymous messages to President
- **AnonymousFeedback**: Anonymous feedback to Members

### Key Relationships

```
TechHead ──verifies──> President, Cabinet, Member
President ──assigns──> Task ──to──> Cabinet, Member
President ──gives──> AnonymousFeedback ──to──> Member
Cabinet ──gives──> AnonymousFeedback ──to──> Member
Cabinet ──marks──> Attendance ──for──> Member
Cabinet/Member ──sends──> AnonymousMessage ──to──> President
```

## 🔐 Authentication

### JWT Token Structure
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "President|Cabinet|Member|TechHead",
  "isVerified": true|false,
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Verification Flow
1. User registers → Receives JWT token (unverified)
2. TechHead verifies user → User status updated
3. User logs in again → Receives new JWT with verified status
4. User can access protected routes

### Middleware Chain
```
Request → authMiddleware → authorizeRoles → requireVerification → Controller
```

## 🧪 Testing

### Postman Collection
Import `Debsoc_API_Collection.postman_collection.json` into Postman for complete API testing.

### Testing Guide
See `API_TESTING_GUIDE.md` for detailed step-by-step testing instructions.

### Manual Testing
```bash
# Health check
curl http://localhost:3000/

# Test CORS
curl -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  http://localhost:3000/api/president/register
```

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:push` | Push schema changes to database |

## 🚀 Deployment

### Quick Deploy

See `DEPLOYMENT_GUIDE.md` for comprehensive deployment instructions.

### Recommended Platforms
- **Render** - Easy deployment with PostgreSQL
- **Railway** - Auto-deployment from GitHub
- **Heroku** - Classic PaaS with addons
- **DigitalOcean** - App Platform with databases

### Production Checklist
- [ ] Update CORS to specific domains
- [ ] Set strong JWT_SECRET
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Configure logging
- [ ] Set up monitoring

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |
| `ALLOWED_ORIGINS` | CORS allowed origins | No | * |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain type safety
- Write meaningful commit messages
- Update documentation for new features
- Test all endpoints before committing

## 📄 License

ISC

## 👥 Authors

- **mobi2400** - [GitHub](https://github.com/mobi2400)

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- Prisma team for the modern ORM
- TypeScript team for type safety

---

**Built with ❤️ for the Debating Society**

For detailed documentation, see:
- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Codebase Analysis](./CODEBASE_ANALYSIS.md)
