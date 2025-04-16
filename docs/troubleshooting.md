# Troubleshooting Guide

This document provides solutions for common issues you might encounter when working with the Reservations API.

## Database Connection Issues

### Issue: Cannot connect to PostgreSQL database

**Error message:**
```
P1001: Can't reach database server at `postgres:5432`
```

**Possible causes:**
1. Docker containers are not running
2. PostgreSQL container failed to start
3. Incorrect database credentials in `.env` file

**Solutions:**

1. **Check if Docker containers are running:**
   ```bash
   docker-compose ps
   ```

2. **Start the PostgreSQL container:**
   ```bash
   docker-compose up -d postgres
   ```

3. **Check PostgreSQL container logs:**
   ```bash
   docker-compose logs postgres
   ```

4. **Verify database credentials in `.env` file:**
   ```
   DATABASE_URL=postgresql://username:password@postgres:5432/database?schema=public
   ```

5. **Try connecting to the database directly:**
   ```bash
   docker-compose exec postgres psql -U username -d database
   ```

## Prisma Migration Issues

### Issue: Prisma migration fails

**Error message:**
```
Error: P1001: Can't reach database server at `postgres:5432`
```

**Solutions:**

1. **Ensure the database is running before attempting migrations:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Run migrations inside the Docker container:**
   ```bash
   docker-compose exec nestjs pnpm run prisma:migrate
   ```

3. **Reset the database if needed:**
   ```bash
   pnpm run reset
   ```

### Issue: Prisma client not generated

**Error message:**
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
pnpm run prisma:gen
```

## TypeScript and Linting Issues

### Issue: TypeScript parsing errors

**Error message:**
```
Parsing error: Cannot read file '/path/to/tsconfig.json'
```

**Solutions:**

1. **Update ESLint configuration:**
   
   Ensure your `.eslintrc.js` file has the correct path to the tsconfig.json file:
   
   ```js
   module.exports = {
     extends: "nestjs",
     parserOptions: {
       project: 'tsconfig.json',
       tsconfigRootDir: __dirname,
       sourceType: 'module',
     },
   };
   ```

2. **Restart your IDE or TypeScript server**

3. **Verify tsconfig.json exists and is valid:**
   ```bash
   cat tsconfig.json
   ```

## Authentication Issues

### Issue: Firebase token verification fails

**Error message:**
```
Firebase ID token has expired
```

**Solutions:**

1. **Check Firebase configuration:**
   
   Ensure the Firebase Admin SDK is properly initialized:
   
   ```typescript
   // src/config/firebase-admin.ts
   import * as admin from 'firebase-admin';
   
   if (!admin.apps.length) {
     admin.initializeApp({
       credential: admin.credential.cert({
         projectId: process.env.FIREBASE_PROJECT_ID,
         clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
         privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
       }),
     });
   }
   
   export { admin };
   ```

2. **Verify environment variables:**
   
   Check that Firebase environment variables are correctly set in `.env`:
   
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY=your-private-key
   ```

3. **Test token verification separately:**
   
   Create a simple test endpoint to verify tokens:
   
   ```typescript
   @Get('verify-token')
   async verifyToken(@Headers('authorization') auth: string) {
     try {
       const token = auth.split('Bearer ')[1];
       const decodedToken = await admin.auth().verifyIdToken(token);
       return { valid: true, uid: decodedToken.uid };
     } catch (error) {
       return { valid: false, error: error.message };
     }
   }
   ```

## Docker and Deployment Issues

### Issue: Docker container fails to start

**Solutions:**

1. **Check Docker logs:**
   ```bash
   docker-compose logs nestjs
   ```

2. **Verify Docker Compose configuration:**
   
   Ensure the `docker-compose.yaml` file has the correct configuration:
   
   ```yaml
   nestjs:
     build:
       context: .
       dockerfile: Dockerfile
     ports:
       - "${NESTJS_PORT}:3000"
     depends_on:
       postgres:
         condition: service_healthy
     environment:
       - NODE_ENV=development
     volumes:
       - ./:/app
       - /app/node_modules
   ```

3. **Rebuild the Docker container:**
   ```bash
   docker-compose build nestjs
   docker-compose up -d nestjs
   ```

## API and Endpoint Issues

### Issue: Endpoint returns 401 Unauthorized

**Possible causes:**
1. Missing or invalid JWT token
2. User's email is not in the allowed emails list
3. User does not exist in the database

**Solutions:**

1. **Check authentication headers:**
   
   Ensure the request includes a valid Authorization header:
   
   ```
   Authorization: Bearer <firebase-id-token>
   ```

2. **Verify the email is allowed:**
   
   Check if the user's email is in the allowed emails list:
   
   ```sql
   SELECT * FROM "AllowedEmail" WHERE email = 'user@example.com';
   ```

3. **Check user existence:**
   
   Verify the user exists in the database:
   
   ```sql
   SELECT * FROM "User" WHERE "firebaseUid" = 'firebase-uid';
   ```

## Performance Issues

### Issue: Slow API responses

**Solutions:**

1. **Enable Prisma query logging to identify slow queries:**
   
   Update the Prisma configuration in `app.module.ts`:
   
   ```typescript
   PrismaModule.forRoot({
     isGlobal: true,
     prismaServiceOptions: {
       middlewares: [
         loggingMiddleware({
           logger: new Logger('PrismaMiddleware'),
           logLevel: 'log',
           logMessage: (query: QueryInfo) =>
             `[Prisma Query] ${query.model}.${query.action} - ${query.executionTime}ms`,
         }),
       ],
     },
   }),
   ```

2. **Add database indexes for frequently queried fields:**
   
   Update the Prisma schema:
   
   ```prisma
   model User {
     id          String   @id @default(uuid())
     email       String   @unique
     firebaseUid String   @unique
     // Add indexes for frequently queried fields
     @@index([email])
   }
   ```

3. **Implement caching for frequently accessed data:**
   
   Use Redis or in-memory caching:
   
   ```typescript
   import { CACHE_MANAGER } from '@nestjs/cache-manager';
   import { Cache } from 'cache-manager';
   
   @Injectable()
   export class UserService {
     constructor(
       private prisma: PrismaService,
       @Inject(CACHE_MANAGER) private cacheManager: Cache,
     ) {}
   
     async getUserByUid(firebaseUid: string) {
       // Try to get from cache first
       const cachedUser = await this.cacheManager.get(`user:${firebaseUid}`);
       if (cachedUser) {
         return cachedUser;
       }
   
       // If not in cache, get from database
       const user = await this.prisma.user.findUnique({
         where: { firebaseUid },
       });
   
       // Store in cache for future requests
       if (user) {
         await this.cacheManager.set(`user:${firebaseUid}`, user, 60 * 5); // 5 minutes
       }
   
       return user;
     }
   }
   