# Social Media Platform Backend (Part Five)

**Assignment 16** | Production-Grade REST & GraphQL API  
Author: Mohamed Mahmoud Abo Al Magd  
Group: Node_C45_Mon&Thurs_9:00pm (Online)

---

## Overview

A scalable, production-ready backend for a modern social media platform with comprehensive authentication, multi-provider OAuth support, real-time notifications, post management, and advanced permission control. Built with **TypeScript**, **Express.js**, **MongoDB**, **Redis**, and **GraphQL**.

**Key Highlights:**
- 🔐 JWT-based authentication with token rotation & multi-provider OAuth (Google)
- 📱 Real-time push notifications via Firebase Cloud Messaging
- 📄 Full CRUD post management with tagging, reactions, and nested comments
- ☁️ Cloud storage integration (Cloudinary/AWS S3) with presigned URLs & streaming
- 🔒 Role-based access control (RBAC) and soft-delete with restoration
- 🎯 GraphQL API alongside REST endpoints
- 📊 Advanced pagination, search, and filtering capabilities

---

## Core Features

### 🔐 Authentication & Authorization
- **Email/Password Authentication**
  - User registration with email confirmation flow
  - OTP-based email verification with rate limiting
  - Password reset via email with expiring OTP tokens
  - Account recovery mechanisms
  
- **OAuth Integration**
  - Google Sign-Up & Sign-In with ID token verification
  - Automatic provider detection and conflict resolution
  - Social profile data import (name, picture)

- **Session Management**
  - JWT access & refresh tokens with secure signatures
  - Token rotation on login to prevent replay attacks
  - Redis-backed FCM token management for push notifications
  - Automatic credential invalidation on password change

- **Authorization**
  - Role-based access control middleware
  - Protected endpoints with user context injection
  - Ownership-based resource authorization (e.g., post edits)

### 👥 User Profile Management
- **Profile Operations**
  - Fetch authenticated user profile with role information
  - Update profile information with validation
  - Soft-delete & restore user accounts
  - Track credential change timestamps

- **Cloud Asset Handling**
  - Upload profile & cover images via signed URLs
  - Image streaming with dynamic content-type headers
  - Presigned URL generation for secure downloads
  - Support for both Cloudinary and AWS S3 backends

### 📝 Post Management
- **Create & Update**
  - Rich content posts with markdown support
  - Multi-file attachments with cloud storage
  - User tagging with mention notifications
  - Availability control (public/private/friends)

- **Discovery & Pagination**
  - Full-text search across posts
  - Availability-aware filtering based on user permissions
  - Cursor-based pagination
  - Nested comment population with recursive replies

- **Interactions**
  - Post reactions (like, love, laugh, etc.)
  - Automatic mention notifications to tagged users
  - Notification persistence in MongoDB
  - Real-time Firebase push notifications

### 💬 Comments & Nested Replies
- Hierarchical comment structure with threaded replies
- GraphQL queries for efficient nested population
- Comment ownership validation

### 📬 Notifications
- **Dual Storage Strategy**
  - Persistent MongoDB storage for history
  - Redis-backed FCM token queues for real-time delivery
  
- **Notification Types**
  - Login alerts with timestamps
  - Post mention notifications
  - Updated post mention alerts
  - Custom notification payloads

### ☁️ Cloud Storage Integration
- **Multi-Backend Support**
  - Cloudinary integration (primary)
  - AWS S3 compatibility layer
  - Pluggable storage interface

- **Features**
  - Resumable multipart uploads via Multer
  - Stream-based downloads for large files
  - Automatic CORS header configuration
  - Presigned URL generation with custom expiration
  - Secure asset deletion with cascade cleanup

### 🔒 Data Protection
- **Soft Delete Pattern**
  - Users and posts can be soft-deleted
  - Paranoid filtering (automatic exclusion of deleted records)
  - Explicit restoration with timestamp tracking
  - Force-delete capability for administrative operations

- **Encryption**
  - Phone numbers encrypted at rest using AES-256-CBC
  - Password hashing with bcrypt (12 rounds)
  - Sensitive data validation and sanitization

---

## Project Architecture

### Directory Structure
```
src/
├── main.ts                          # Application entry point
├── app.bootstrap.ts                 # Express app setup, middleware config, routing
├── config/
│   └── config.ts                    # Environment variables & multi-env support
├── modules/
│   ├── auth/                        # Authentication logic
│   │   ├── auth.controller.ts       # Route handlers
│   │   ├── auth.service.ts          # Business logic (login, signup, OAuth)
│   │   ├── auth.dto.ts              # Data transfer objects
│   │   ├── auth.validation.ts       # Zod schemas
│   │   └── auth.entity.ts           # TypeScript interfaces
│   ├── user/                        # User profile API
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.authorization.ts    # RBAC rules
│   │   └── gql/                     # GraphQL resolvers
│   ├── post/                        # Post management API
│   │   ├── post.controller.ts
│   │   ├── post.service.ts
│   │   ├── post.validation.ts       # Complex Zod schemas
│   │   └── gql/                     # GraphQL resolvers
│   ├── comment/                     # Comment management
│   ├── graphql/                     # GraphQL schema & setup
│   │   └── schema.gql.ts            # Unified schema definition
│   └── index.ts                     # Module exports
├── middleware/
│   ├── authentication.middleware.ts # JWT verification & user context
│   ├── authorization.middleware.ts  # Role-based access control
│   ├── error.middleware.ts          # Centralized error handling
│   ├── validation.middleware.ts     # Request body/query validation
│   └── index.ts
├── common/
│   ├── services/
│   │   ├── token.service.ts         # JWT generation & validation
│   │   ├── cloudinary.service.ts    # Cloud storage abstraction
│   │   ├── redis.service.ts         # Redis client wrapper
│   │   └── notification.service.ts  # Firebase messaging
│   ├── validation/                  # Shared Zod schemas (pagination, auth)
│   ├── enums/                       # Role, Provider, Email subject enums
│   ├── exceptions/                  # Custom error classes
│   ├── interfaces/                  # TypeScript types (IUser, IPost, etc.)
│   ├── utils/
│   │   ├── security.ts              # Password hashing, encryption
│   │   ├── email.ts                 # Nodemailer integration
│   │   ├── otp.ts                   # OTP generation
│   │   └── post.ts                  # Post visibility helpers
│   ├── response/                    # Response formatting utilities
│   └── types/                       # Custom type definitions
├── DB/
│   ├── connection.db.ts             # MongoDB connection
│   ├── models/                      # Mongoose schemas (User, Post, Comment, Notification)
│   └── repository/                  # Generic CRUD repository pattern
└── dist/                            # Compiled JavaScript (build output)
```

### Architecture Patterns

**Repository Pattern**
- Generic `BaseRepository<T>` with create, read, update, delete, paginate, find methods
- Automatic soft-delete filtering via paranoid middleware
- Transaction-friendly query builders

**Service Layer**
- Business logic isolation from controllers
- Cross-cutting concerns (notifications, Redis, cloud storage)
- Dependency injection via constructors

**Middleware Chain**
- CORS configuration
- Global error handling
- Request validation before reaching routes
- JWT authentication for protected endpoints

**Dual API Support**
- REST endpoints for CRUD operations (traditional client compatibility)
- GraphQL endpoint at `/GraphQL` for flexible queries and reduced over-fetching

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Runtime** | Node.js (CommonJS, ES2023) | Latest LTS |
| **Language** | TypeScript | 5.x (strict mode) |
| **Framework** | Express.js | 5.2+ |
| **Database** | MongoDB & Mongoose | 7.x |
| **Cache/Queue** | Redis | 5.x |
| **GraphQL** | graphql-http, graphql | 16.x |
| **Authentication** | JSON Web Tokens, google-auth-library | 10.6+ |
| **Cloud Storage** | Cloudinary, AWS SDK S3 | 2.10, 3.1 |
| **Push Notifications** | Firebase Admin | 13.8+ |
| **Validation** | Zod | 4.3+ |
| **File Upload** | Multer | 2.1+ |
| **Encryption** | bcrypt | 6.0+ |
| **Email** | Nodemailer | 8.0+ |
| **Dev Tools** | cross-env, concurrently, TypeScript compiler | Latest |

---

## API Endpoints

### Authentication Routes (`/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/signup` | Register with email/password | ❌ |
| POST | `/login` | Login with credentials | ❌ |
| PATCH | `/confirm-email` | Verify email with OTP | ❌ |
| POST | `/resend-confirm-email` | Resend confirmation OTP | ❌ |
| POST | `/forget-password` | Request password reset | ❌ |
| PATCH | `/reset-password` | Reset password with OTP | ❌ |
| POST | `/signup/gmail` | Google OAuth signup | ❌ |
| POST | `/login/gmail` | Google OAuth login | ❌ |

### User Routes (`/user`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Fetch authenticated user profile | ✅ |
| PATCH | `/profile-image` | Upload profile image (presigned URL) | ✅ |
| POST | `/rotate-token` | Refresh JWT credentials | ✅ |

### Post Routes (`/post`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create new post | ✅ |
| GET | `/` | List posts with pagination | ✅ |
| PATCH | `/:postId` | Update post by ID | ✅ |
| DELETE | `/:postId` | Delete post (soft-delete) | ✅ |
| POST | `/:postId/react` | Add/remove post reaction | ✅ |

### Asset Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/uploads/*path` | Stream asset with optional download | ❌ |
| GET | `/presigned/*path` | Generate presigned download URL | ❌ |

### GraphQL Endpoint
| Endpoint | Description | Auth |
|----------|-------------|------|
| `/GraphQL` | GraphQL API runner (introspection enabled) | ✅ |

---

## Environment Configuration

Create `.env.development` or `.env.production` files:

```env
# Server
PORT=30000
NODE_ENV=development

# Database
DB_URI=mongodb://localhost:27017/social-media

# Redis
REDIS_URL=redis://localhost:6379

# Encryption
SALT_ROUND=12
ENC_IV_LENGTH=16
ENC_KEY=your-32-char-encryption-key-here

# JWT Tokens
USER_ACCESS_TOKEN_SIGNATURE=your-user-access-secret
USER_REFRESH_TOKEN_SIGNATURE=your-user-refresh-secret
SYSTEM_ACCESS_TOKEN_SIGNATURE=your-system-access-secret
SYSTEM_REFRESH_TOKEN_SIGNATURE=your-system-refresh-secret

# Token Expiration (seconds)
ACCESS_TOKEN_EXPIRES_IN=1800        # 30 minutes
REFRESH_TOKEN_EXPIRES_IN=31536000   # 1 year

# Email Service (Gmail OAuth)
APP_EMAIL=your-gmail@gmail.com
APP_EMAIL_PASSWORD=your-app-specific-password

# Application
APPLICATION_NAME=Social Media Platform
CLIENT_IDS=your-google-client-id.apps.googleusercontent.com

# Social Links
FACEBOOK=https://facebook.com/yourpage
INSTAGRAM=https://instagram.com/yourprofile
TWITTER=https://twitter.com/yourhandle

# CORS Origins (comma-separated)
ORIGINS=http://localhost:3000,http://localhost:5173

# Cloudinary (Primary Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_EXPIRES_IN=120

# AWS S3 (Alternative Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_EXPIRES_IN=3600
```

---

## Setup & Installation

### Prerequisites
- Node.js 18.x or later
- MongoDB 5.x or later
- Redis 6.x or later
- npm or yarn

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
# Copy example and edit with your credentials
cp .env.example .env.development
nano .env.development
```

### Step 3: Build & Run

**Development (with hot reload)**
```bash
npm run start:dev
```

**Production**
```bash
npm run start:prod
```

### Step 4: Verify Server
```bash
curl http://localhost:30000/
# Response: {"message":"Landing Page"}
```

---

## Key Implementation Details

### Authentication Flow
1. User registers → OTP sent to email
2. User confirms email with OTP → Account activated
3. User logs in → Access token + Refresh token returned
4. Access token expires in 30 min → Use refresh token to get new pair
5. On Google OAuth → Verify ID token → Auto-create/login user

### Post Visibility Control
- **Public**: Visible to all authenticated users
- **Private**: Only creator can view
- **Friends**: Only friends of creator (extensible)
- **Custom**: Owner-defined access list

### Notification Delivery
1. Event triggered (e.g., user mentioned in post)
2. Notification saved to MongoDB (history)
3. FCM tokens fetched from Redis
4. Firebase sends push to all active tokens
5. Client handles notification payload

### Cloud Storage Workflow
```
Request Upload → Generate Presigned URL → Client uploads directly → 
Asset URL returned → Stored in DB reference → 
On Download: Stream via /uploads or generate presigned link
```

### Soft Delete Pattern
```typescript
// User deleted? → deletedAt field set
// findOne query → automatically filters deletedAt: null (paranoid: true)
// To include deleted: findOne({ ..., paranoid: false })
// Force delete: deleteOne({ ..., force: true })
```

---

## Development Workflow

### TypeScript Configuration
- **Strict mode** enabled for maximum type safety
- **Isolated modules** for better build optimization
- **No unchecked indexed access** to prevent runtime errors
- **Exact optional properties** for precise type definitions

### Validation Strategy
- **Zod schemas** for runtime type checking
- **Validation middleware** on all input routes
- **DTO pattern** for type-safe data transformation

### Error Handling
- **Custom exception classes** (BadRequestException, ConflictException, etc.)
- **Global error middleware** for consistent responses
- **Proper HTTP status codes** for all scenarios

### Testing Middleware (in app.bootstrap.ts)
The bootstrap includes CRUD operations on the User model to test:
- ✅ Pre-save middleware (password hashing, phone encryption)
- ✅ Pre-update middleware
- ✅ Soft delete enforcement
- ✅ Paranoid filtering
- ✅ Data restoration

---

## AWS Lambda Integration

The repository includes an S3 Lambda function (`S3 LAMBDA FUNCTION/`) for serverless processing:
- Triggered on file upload to S3
- MongoDB integration for metadata updates
- Extensible for image optimization, virus scanning, etc.

---

## Production Considerations

✅ **Security**
- Strict TypeScript compilation
- Password hashing with bcrypt
- Phone encryption at rest
- JWT token signatures
- CORS validation
- Input sanitization with Zod

✅ **Performance**
- Redis caching for OTP & FCM tokens
- Connection pooling (MongoDB)
- Streaming responses for large files
- Efficient pagination
- GraphQL for reduced payload

✅ **Reliability**
- Soft delete prevents data loss
- Restoration capability
- Transaction-aware repository pattern
- Error middleware catches unhandled exceptions
- Graceful shutdown on critical errors

✅ **Observability**
- Structured logging (console + optional integration)
- Request/response timing
- Error stack traces
- Notification audit trail in MongoDB

---

## Contributing

This is an educational assignment. For improvements or bug fixes:
1. Create a feature branch
2. Write type-safe TypeScript with strict checks
3. Add validation with Zod schemas
4. Test with the middleware bootstrap
5. Submit a pull request

---

## License

ISC

---

## Support & Contact

**Author**: Mohamed Mahmoud Abo Al Magd  
**Group**: Node_C45_Mon&Thurs_9:00pm (Online)  
**GitHub**: [abo-al-magd-404](https://github.com/abo-al-magd-404)

For detailed API schema and GraphQL introspection, visit `/GraphQL` after starting the server.

---

**Last Updated**: May 16, 2026
