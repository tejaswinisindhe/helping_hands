
# Helping Hands Backend API

This is the backend API for the Helping Hands volunteer platform. It provides the necessary routes and services to power the frontend application.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB

### Installation

1. Navigate to the backend directory:
   ```
   cd src/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root of the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/helping-hands
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:3000
   ```

4. Start the server:
   ```
   npm run dev
   ```

## API Documentation

### Authentication Endpoints

- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Login user
- **GET /api/auth/me** - Get current user profile
- **POST /api/auth/google** - Google OAuth login/register
- **POST /api/auth/logout** - Logout user
- **POST /api/auth/forgot-password** - Request password reset
- **PUT /api/auth/reset-password/:resetToken** - Reset password

### User Endpoints

- **GET /api/users** - Get all users (Admin only)
- **GET /api/users/:id** - Get user by ID
- **PUT /api/users/:id** - Update user profile
- **POST /api/users/:id/resume** - Upload user resume
- **POST /api/users/:id/avatar** - Upload user avatar
- **DELETE /api/users/:id** - Delete user
- **GET /api/users/nearby** - Get nearby volunteers (Coordinators and Admins)

### Project Endpoints

- **GET /api/projects** - Get all projects (with pagination and filtering)
- **GET /api/projects/:id** - Get single project
- **POST /api/projects** - Create new project (Coordinators and Admins)
- **PUT /api/projects/:id** - Update project (Project coordinator or Admin)
- **DELETE /api/projects/:id** - Delete project (Project coordinator or Admin)
- **POST /api/projects/:id/apply** - Apply for a project (Volunteers)
- **PUT /api/projects/:id/applications/:userId** - Update volunteer application status (Project coordinator or Admin)
- **POST /api/projects/:id/media** - Upload project images (Project coordinator or Admin)
- **POST /api/projects/:id/hours/:userId** - Log volunteer hours (Project coordinator or Admin)

### Chat Endpoints

- **POST /api/chat/messages** - Send a new message
- **GET /api/chat/messages/user/:userId** - Get messages for a specific user conversation
- **GET /api/chat/messages/project/:projectId** - Get messages for a specific project
- **GET /api/chat/conversations** - Get all conversations for a user
- **GET /api/chat/project-conversations** - Get project conversations
- **PUT /api/chat/messages/:messageId/read** - Mark messages as read
- **DELETE /api/chat/messages/:messageId** - Delete message

### Notification Endpoints

- **GET /api/notifications** - Get all notifications for a user
- **POST /api/notifications** - Create a notification (Admin or Coordinator)
- **PUT /api/notifications/:id** - Mark notification as read
- **PUT /api/notifications/read-all** - Mark all notifications as read
- **DELETE /api/notifications/:id** - Delete notification
- **POST /api/notifications/bulk** - Send bulk notifications (Admin only)

### Analytics Endpoints

- **GET /api/analytics/volunteer** - Get personal volunteer analytics
- **GET /api/analytics/project/:projectId** - Get project analytics (Project coordinator or Admin)
- **GET /api/analytics/organization** - Get organization-wide analytics (Admin only)

### Search Endpoints

- **GET /api/search** - Search projects and volunteers
- **GET /api/search/advanced** - Advanced search with filters
- **GET /api/search/match/volunteer/:volunteerId** - Skill-based matching for volunteers (Admin and Coordinators)
- **GET /api/search/match/project/:projectId** - Find volunteers for a project (Admin and Coordinators)

## WebSocket Events

- **connection** - User connects to WebSocket
- **join-project** - User joins a project room
- **send-message** - User sends a message
- **receive-message** - User receives a message
- **notification** - Send a notification
- **new-notification** - User receives a notification
- **typing** - User is typing
- **user-typing** - Notify others that a user is typing
- **disconnect** - User disconnects from WebSocket

## Authentication and Authorization

- **JWT Authentication** - Used for authenticating API requests
- **Role-Based Access Control** - Different endpoints available based on user role (volunteer, coordinator, admin)
