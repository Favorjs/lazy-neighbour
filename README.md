# Lazy Neighbour 🏃😴

A hyper-local, gamified errand-running marketplace that connects "Lazy" users (requesters) with "Runners" (earners) via a secure P2P escrow system.

## 📱 Screenshots

*Screenshots will appear here after you run the app*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Expo Go app on your phone (for mobile testing)
- Stripe account (for payments, optional)

### 1. Setup Database

Create a PostgreSQL database and update the connection string.

### 2. Configure Environment

Copy the example env file and update with your credentials:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your actual values:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lazy_neighbour"
JWT_SECRET="your-secure-jwt-secret"
STRIPE_SECRET_KEY="sk_test_..." # Optional
```

### 3. Start the Backend

```bash
cd server

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start the server
npm run dev
```

Server will run at `http://localhost:3000`

### 4. Start the Mobile App

```bash
cd mobile

# Start Expo
npm start
```

Then either:
- **📱 Scan QR code** with Expo Go app on your phone
- **🌐 Press 'w'** to open in web browser
- **Press 'a'** for Android emulator
- **Press 'i'** for iOS simulator (Mac only)

## 📁 Project Structure

```
lazy-neighbour/
├── mobile/                 # React Native Expo app
│   ├── app/               # Screens (Expo Router)
│   │   ├── (auth)/        # Login, Register
│   │   ├── (tabs)/        # Feed, Radar, Errands, Profile
│   │   ├── errand/        # Errand detail
│   │   ├── chat/          # Chat screen
│   │   └── post.js        # Create errand
│   ├── components/        # Reusable UI components
│   ├── services/          # API client
│   └── constants/         # Config, colors, etc.
│
├── server/                 # Node.js Express backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth middleware
│   │   └── models/        # Prisma client
│   └── prisma/            # Database schema
│
└── shared/                 # Shared types (optional)
```

## 🎮 Features

### Lazy (Requester) Flow
- ✅ Post errands with title, description, category, and bounty
- ✅ Set location for errand
- ✅ Track errand status
- ✅ Chat with Runner
- ✅ Release payment when satisfied

### Runner (Earner) Flow
- ✅ Browse errands on radar map (5km radius)
- ✅ Filter by category
- ✅ Accept errands
- ✅ Chat with requester
- ✅ Upload proof of completion
- ✅ Get paid on completion

### Gamification
- ✅ Karma points system
- ✅ Level progression
- ✅ User ratings

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/toggle-role` - Switch Lazy/Runner mode

### Errands
- `POST /api/errands` - Create errand
- `GET /api/errands/nearby?lat=&lng=` - Get nearby errands
- `GET /api/errands/feed` - Get feed
- `GET /api/errands/my` - Get user's errands
- `POST /api/errands/:id/accept` - Accept errand
- `POST /api/errands/:id/complete` - Mark complete
- `POST /api/errands/:id/release` - Release payment

### Chat
- `GET /api/chat/:errandId` - Get messages
- `POST /api/chat/:errandId` - Send message

## 🛠 Tech Stack

- **Frontend**: React Native, Expo, Expo Router
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL, Prisma ORM
- **Payments**: Stripe Connect (optional)
- **Maps**: react-native-maps

## 📝 Environment Variables

### Server (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_... (optional)
PORT=3000
SERVICE_FEE_PERCENT=10
```

### Mobile (constants/config.js)
```javascript
export const API_URL = 'http://localhost:3000';
```

For production, update this to your deployed API URL.

## 🚀 Deployment

### Backend
Deploy to any Node.js hosting (Railway, Render, Heroku, etc.)

### Mobile
```bash
# Build for production
eas build --platform all
```

## 📜 License

MIT
