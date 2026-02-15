# Backend Ledger - Advanced Authentication API

A robust, production-ready backend API built with **Node.js**, **Express.js**, and **MongoDB**. This project implements a comprehensive authentication system with JWT tokens, secure password hashing, and email verification capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **User Registration** - Create new user accounts with email validation
- **User Login** - Secure login with JWT token generation
- **Password Security** - Bcryptjs for password hashing and encryption
- **JWT Authentication** - Token-based authentication system
- **Email Service** - Nodemailer integration for email notifications
- **Cookie Management** - Secure cookie-based session handling
- **Mongoose Validation** - Built-in data validation at schema level
- **Error Handling** - Comprehensive error handling and validation
- **Environment Configuration** - Dotenv for secure configuration management

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL Database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Token authentication |
| **Bcryptjs** | Password hashing |
| **Nodemailer** | Email service |
| **Cookie-parser** | Cookie middleware |
| **Dotenv** | Environment variables |

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (v4.4 or higher) - Local or MongoDB Atlas
- **Git** (optional, for version control)

## 🚀 Installation

### Step 1: Clone or Download the Project

```bash
# Clone the repository
git clone <repository-url>
cd backend-ledger

# Or navigate to your project directory
cd Backend-ledger
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- express
- mongoose
- jsonwebtoken
- bcryptjs
- nodemailer
- cookie-parser
- dotenv

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/backend-ledger

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Step 4: Start the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
Backend-ledger/
├── src/
│   ├── app.js                      # Express app configuration
│   ├── server.js                   # Entry point (moved to root)
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── controller/
│   │   └── auth.controller.js      # Authentication logic
│   ├── models/
│   │   └── user.model.js           # User schema and methods
│   ├── routes/
│   │   └── auth.routes.js          # Authentication routes
│   └── services/
│       └── email.service.js        # Email sending logic
├── .env                            # Environment variables (create this)
├── .gitignore                      # Git ignore file
├── package.json                    # Dependencies
├── server.js                       # Server entry point
└── README.md                       # This file
```

## 🔌 API Endpoints

### Authentication Routes

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│         User Registration Flow                       │
├─────────────────────────────────────────────────────┤
│ 1. User sends email, name, password                 │
│ 2. Validate email format & password strength        │
│ 3. Check if email already exists                    │
│ 4. Hash password using bcryptjs                     │
│ 5. Save user to MongoDB                             │
│ 6. Generate JWT token                               │
│ 7. Return token & user data                         │
│ 8. Send verification email (optional)               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         User Login Flow                             │
├─────────────────────────────────────────────────────┤
│ 1. User sends email & password                      │
│ 2. Find user by email in database                   │
│ 3. Compare provided password with hashed password   │
│ 4. If match: Generate JWT token                     │
│ 5. Set token in cookie                              │
│ 6. Return token & user data                         │
│ 7. If no match: Return error                        │
└─────────────────────────────────────────────────────┘
```

## 💡 Usage Examples

### Using cURL

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "securePassword123"
  }'

# Login user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

### Using Postman

1. Create a new request collection
2. Set method to `POST`
3. Enter URL: `http://localhost:3000/api/auth/register`
4. Go to **Body** tab → Select **raw** → Choose **JSON**
5. Paste the request body and send

### Using Fetch API (Frontend)

```javascript
// Register
fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    password: 'securePassword123'
  }),
  credentials: 'include' // Include cookies
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));

// Login
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123'
  }),
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  localStorage.setItem('token', data.token);
  console.log('Login successful');
})
.catch(err => console.error(err));
```

## 🎯 Best Practices

### Security

- ✅ Always use HTTPS in production
- ✅ Hash passwords with bcryptjs (never store plain passwords)
- ✅ Use environment variables for sensitive data
- ✅ Implement rate limiting for API endpoints
- ✅ Validate all user inputs
- ✅ Use secure JWT secrets (min 32 characters)
- ✅ Implement CORS properly for frontend access

### Code Organization

- ✅ Keep business logic in controllers
- ✅ Separate data access logic in services
- ✅ Use middleware for authentication checks
- ✅ Implement consistent error handling
- ✅ Use async/await for promise handling

### Database

- ✅ Always validate data at schema level
- ✅ Set appropriate indexes for frequently queried fields
- ✅ Use unique constraints for emails
- ✅ Implement timestamps (createdAt, updatedAt)

### API Design

- ✅ Use RESTful conventions
- ✅ Return appropriate HTTP status codes
- ✅ Provide clear error messages
- ✅ Document all endpoints
- ✅ Implement proper pagination for list endpoints

## 🐛 Troubleshooting

### Common Issues

**Issue: "Cannot connect to MongoDB"**
```
Solution:
1. Check MongoDB connection string in .env
2. Verify MongoDB is running
3. Check firewall settings
4. Verify username and password
```

**Issue: "JWT is not defined"**
```
Solution:
1. Make sure jsonwebtoken is installed: npm install jsonwebtoken
2. Check JWT_SECRET is set in .env
```

**Issue: "CORS errors when connecting from frontend"**
```
Solution:
Add CORS middleware to app.js:
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**Issue: "Email not sending"**
```
Solution:
1. Check EMAIL_USER and EMAIL_PASSWORD in .env
2. Enable "Less secure apps" for Gmail
3. Generate App Password for Gmail account
4. Check nodemailer configuration
```

**Issue: "Port 3000 already in use"**
```
Solution:
1. Change PORT in .env file
2. Or kill the process: lsof -i :3000 (Mac/Linux)
```

## 📚 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Guide](https://jwt.io/introduction)
- [Nodemailer Guide](https://nodemailer.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the `package.json` file for details.

## 👨‍💻 Author

**Aditya Sureka**

Feel free to reach out for questions or suggestions!

---

**Happy Coding! 🚀**

Last Updated: February 15, 2026
