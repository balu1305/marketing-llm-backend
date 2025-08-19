# 🚀 AI Marketing Campaign Generator - Backend API

A robust Node.js backend API for an AI-powered marketing campaign generator, built with Express.js, MongoDB, and JWT authentication.

## 📋 Features

- **User Authentication & Authorization**

  - JWT-based authentication with refresh tokens
  - Role-based access control
  - Password hashing with bcryptjs
  - Secure profile management

- **Persona Management**

  - Full CRUD operations for customer personas
  - Predefined personas for quick start
  - Advanced search and filtering
  - User-specific persona isolation

- **Security & Performance**

  - Rate limiting protection
  - CORS configuration
  - Helmet security headers
  - Input validation and sanitization
  - Comprehensive error handling

- **Database Design**
  - MongoDB with Mongoose ODM
  - Optimized schemas with indexes
  - Data validation and relationships
  - Aggregation pipelines for analytics

## 🛠️ Tech Stack

- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Environment**: dotenv for configuration

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd marketing-llm-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/marketing-llm-db
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:

   ```bash
   # Using MongoDB service (Linux/Mac)
   sudo systemctl start mongod

   # Using MongoDB directly
   mongod
   ```

5. **Seed the database** (Optional)

   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 🗄️ Database Schema

### Users Collection

```javascript
{
  email: String (unique),
  passwordHash: String,
  firstName: String,
  lastName: String,
  companyName: String,
  role: String, // 'user', 'manager', 'admin'
  subscriptionTier: String, // 'free', 'basic', 'pro', 'enterprise'
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Personas Collection

```javascript
{
  userId: ObjectId (ref: User),
  name: String,
  description: String,
  demographics: {
    age: String,
    income: String,
    location: String
  },
  psychographics: {
    values: [String],
    interests: [String]
  },
  painPoints: [String],
  goals: [String],
  preferredChannels: [String],
  isPredefined: Boolean,
  createdAt: Date
}
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
POST   /api/auth/logout        - Logout user
POST   /api/auth/refresh-token - Refresh access token
GET    /api/auth/profile       - Get user profile
PUT    /api/auth/profile       - Update user profile
```

### Personas

```
GET    /api/personas           - Get all personas (user + predefined)
POST   /api/personas           - Create new persona
GET    /api/personas/:id       - Get single persona
PUT    /api/personas/:id       - Update persona
DELETE /api/personas/:id       - Delete persona
GET    /api/personas/stats     - Get persona statistics
```

### General

```
GET    /api                    - API documentation
GET    /api/health             - Health check
```

## 🧪 Testing the API

### Using the Demo User

After seeding the database, you can test with:

- **Email**: `demo@marketingllm.com`
- **Password**: `Demo123!`

### Example Requests

1. **Register a new user**

   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "SecurePass123!",
       "firstName": "John",
       "lastName": "Doe",
       "companyName": "Acme Corp"
     }'
   ```

2. **Login**

   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "SecurePass123!"
     }'
   ```

3. **Get personas** (requires authentication)

   ```bash
   curl -X GET http://localhost:5000/api/personas \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Create a persona**
   ```bash
   curl -X POST http://localhost:5000/api/personas \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "name": "Tech Startup Founders",
       "description": "Early-stage startup founders in the tech industry",
       "demographics": {
         "age": "25-40",
         "income": "$75K-$200K",
         "location": "Silicon Valley, NYC, Austin"
       },
       "psychographics": {
         "values": ["Innovation", "Growth", "Disruption"],
         "interests": ["Technology", "Entrepreneurship", "Venture Capital"]
       },
       "painPoints": ["Limited funding", "Market validation", "Team building"],
       "goals": ["Scale the business", "Secure funding", "Build great products"],
       "preferredChannels": ["linkedin", "twitter", "tech-blogs"]
     }'
   ```

## 🚀 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run seed       # Seed database with predefined data
npm run seed:reset # Reset and seed database
```

## 🔐 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin requests
- **Security Headers**: Helmet.js for security headers

## 📊 Monitoring & Logging

- Request logging in development mode
- Comprehensive error handling and logging
- Health check endpoint for monitoring
- Graceful shutdown handling

## 🧩 Project Structure

```
src/
├── config/           # Configuration files
│   └── database.js   # MongoDB connection
├── controllers/      # Route controllers
│   ├── authController.js
│   └── personaController.js
├── middleware/       # Custom middleware
│   ├── auth.js       # Authentication middleware
│   ├── errorHandler.js
│   └── validation.js # Input validation
├── models/           # Mongoose models
│   ├── User.js
│   └── Persona.js
├── routes/           # Express routes
│   ├── index.js
│   ├── auth.js
│   └── personas.js
├── utils/            # Utility functions
│   └── jwt.js        # JWT helpers
└── server.js         # Main application file

scripts/
└── seed.js           # Database seeding script

seed-data/
└── personas.json     # Predefined personas data
```

## 🔄 Development Workflow

1. **Start MongoDB** service
2. **Run seeding** to populate initial data
3. **Start dev server** with hot reload
4. **Test endpoints** using Postman or curl
5. **Monitor logs** for debugging

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify database permissions

2. **JWT Token Errors**

   - Check JWT_SECRET in environment
   - Verify token format in Authorization header
   - Ensure token hasn't expired

3. **Validation Errors**
   - Check request body format
   - Verify required fields are present
   - Review validation rules in middleware

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and request logging.

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://your-production-db/marketing-llm
JWT_SECRET=your-very-secure-secret-key
JWT_REFRESH_SECRET=your-very-secure-refresh-key
CLIENT_URL=https://your-frontend-domain.com
```

### Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure production MongoDB URI
- [ ] Set up proper CORS origins
- [ ] Enable MongoDB authentication
- [ ] Set up monitoring and logging
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL certificates

## 📚 Next Steps (Phase 2+)

- Campaign management endpoints
- AI content generation integration
- Real-time notifications with Socket.io
- Advanced analytics and reporting
- File upload for media assets
- Background job processing
- Email service integration

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for the AI Marketing Campaign Generator**
