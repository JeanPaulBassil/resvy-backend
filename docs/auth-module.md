# Authentication Module Documentation

## Overview

The Authentication module handles user authentication and authorization in the Reservations API. It uses Firebase Authentication for identity verification and integrates with the AllowedEmail module to provide an additional layer of access control.

## Components

### 1. AuthService

The `AuthService` is responsible for verifying Firebase tokens and managing the authentication process:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private allowedEmailService: AllowedEmailService,
  ) {}

  async verifyToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async login(token: string, userData: { name: string; email: string }) {
    const decodedToken = await this.verifyToken(token);
    const firebaseUid = decodedToken.uid;
    const email = userData.email.toLowerCase();

    // Check if email is allowed
    const isAllowed = await this.allowedEmailService.isEmailAllowed(email);
    
    if (!isAllowed) {
      throw new UnauthorizedException('Email not allowed to access the system');
    }

    // Create or update user
    const user = await this.userService.createUser(
      firebaseUid,
      email,
      userData.name,
    );

    return { message: 'Login successful', user };
  }
}
```

### 2. AuthController

The `AuthController` exposes endpoints for authentication:

```typescript
@ApiTags('auth')
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: 'Login with Firebase token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Req() req, @Body() body: { name: string; email: string }) {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.authService.login(token, body);
    } catch (error) {
      console.error("Authentication Error:", error);
      throw new HttpException(
        error.message || 'Authentication failed', 
        error.status || HttpStatus.UNAUTHORIZED
      );
    }
  }
}
```

### 3. AuthMiddleware

The `AuthMiddleware` protects routes by verifying authentication tokens:

```typescript
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { firebaseUid },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Attach user to request
      req["user"] = user;
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(401).json({ message: "Invalid token" });
    }
  }
}
```

## Authentication Flow

1. **Client Authentication**:
   - The client authenticates with Firebase Authentication
   - The client receives a Firebase ID token

2. **API Authentication**:
   - The client sends the Firebase ID token in the Authorization header
   - The server verifies the token using Firebase Admin SDK
   - The server checks if the user's email is in the allowed emails list
   - If valid, the server creates or updates the user in the database
   - The server returns user information to the client

3. **Route Protection**:
   - Protected routes use the AuthMiddleware
   - The middleware verifies the token and attaches the user to the request
   - If the token is invalid or the user is not found, the request is rejected

## Integration with AllowedEmail Module

The Authentication module integrates with the AllowedEmail module to ensure that only users with allowed emails can log in. This integration is implemented in the `login` method of the `AuthService`:

```typescript
// Check if email is allowed
const isAllowed = await this.allowedEmailService.isEmailAllowed(email);

if (!isAllowed) {
  throw new UnauthorizedException('Email not allowed to access the system');
}
```

## Security Considerations

1. **Token Verification**: All tokens are verified using Firebase Admin SDK to ensure authenticity.

2. **Email Allowlisting**: Only users with emails in the allowed list can log in, providing an additional layer of access control.

3. **Error Handling**: Authentication errors are properly handled and do not expose sensitive information.

4. **HTTPS**: All authentication requests should be made over HTTPS to prevent token interception.

## Usage Examples

### Login

```typescript
// Client-side code
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseIdToken}`
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
});

const data = await response.json();
// Store user information and handle login success/failure
```

### Protecting Routes

```typescript
// In app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: "auth/login", method: RequestMethod.POST },
        { path: "auth/register", method: RequestMethod.POST },
      )
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
```

## Troubleshooting

### Common Issues

1. **Invalid Token**:
   - Ensure the Firebase token is valid and not expired
   - Check that the Firebase project configuration is correct

2. **Email Not Allowed**:
   - Verify that the user's email is in the allowed emails list
   - Check for case sensitivity issues (emails are stored in lowercase)

3. **User Not Found**:
   - Ensure the user exists in the database
   - Check that the Firebase UID matches the one in the database 