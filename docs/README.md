# Reservations API Documentation

## Overview

This document provides an overview of the Reservations API, a NestJS-based backend service that manages user authentication, allowed emails, and other reservation-related functionality.

## System Architecture

The Reservations API is built using:
- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications
- **Prisma**: Next-generation ORM for Node.js and TypeScript
- **PostgreSQL**: Relational database for data storage
- **Firebase Auth**: For user authentication
- **Docker**: For containerization and deployment

## Core Modules

### 1. Authentication Module

The authentication module handles user login and registration using Firebase authentication. It includes:

- **AuthController**: Handles login requests
- **AuthService**: Verifies Firebase tokens and checks if emails are allowed
- **AuthMiddleware**: Protects routes by verifying authentication tokens

Key features:
- Firebase token verification
- Integration with AllowedEmail system for access control
- User creation/update during authentication

### 2. Allowed Email Module

The allowed email module manages a whitelist of email addresses that are permitted to access the system. This provides an additional layer of access control beyond Firebase authentication.

Components:
- **AllowedEmailController**: REST API endpoints for CRUD operations on allowed emails
- **AllowedEmailService**: Business logic for managing allowed emails
- **DTOs**: Data Transfer Objects for validation and documentation

Endpoints:
- `GET /allowed-emails`: List all allowed emails
- `GET /allowed-emails/:id`: Get a specific allowed email
- `POST /allowed-emails`: Create a new allowed email
- `PUT /allowed-emails/:id`: Update an allowed email
- `DELETE /allowed-emails/:id`: Delete an allowed email

### 3. User Module

The user module manages user accounts in the system.

Components:
- **UserController**: Handles user-related requests
- **UserService**: Manages user creation and retrieval

## Database Schema

The database schema includes the following key models:

### User Model
- `id`: Unique identifier
- `email`: User's email address
- `name`: User's name
- `firebaseUid`: Firebase user ID
- `isActive`: Whether the user is active
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

### AllowedEmail Model
- `id`: Unique identifier
- `email`: Email address that is allowed to access the system
- `description`: Optional description of why this email is allowed
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update
- `createdBy`: ID of the user who created this entry

## Recent Changes

### Added AllowedEmail System (June 2023)

1. **Schema Update**:
   - Added `AllowedEmail` model to Prisma schema
   - Added `isActive` field to User model

2. **Module Creation**:
   - Created AllowedEmailModule with controller, service, and DTOs
   - Implemented CRUD operations for allowed emails
   - Added email validation using class-validator

3. **Authentication Integration**:
   - Updated AuthService to check if emails are allowed during login
   - Integrated AllowedEmailModule with AuthModule

4. **Linting Configuration**:
   - Updated ESLint configuration to correctly reference the tsconfig.json file
   - Fixed parsing errors in the IDE

## Development Setup

### Prerequisites
- Node.js (v16+)
- Docker and Docker Compose
- pnpm package manager

### Environment Setup
1. Copy `.env.template` to `.env` and configure environment variables
2. Start the database: `docker-compose up -d postgres`

### Running Migrations
```bash
pnpm migrate
```

### Starting the Development Server
```bash
pnpm start:dev
```

## Deployment

The application is containerized using Docker and can be deployed using:

```bash
docker-compose up -d
```

For production deployment:

```bash
docker-compose -f prod.docker-compose.yaml up -d
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Ensure PostgreSQL container is running: `docker-compose ps`
   - Check database credentials in `.env` file

2. **Linting Errors**:
   - If you encounter "Cannot read file '/path/to/tsconfig.json'" errors, ensure the ESLint configuration correctly points to the tsconfig.json file.
   - The current configuration in `.eslintrc.js` should resolve this issue.

3. **Prisma Migration Issues**:
   - Run `pnpm prisma:gen` to regenerate Prisma client
   - Ensure database is accessible before running migrations 