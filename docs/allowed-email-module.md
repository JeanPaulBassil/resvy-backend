# AllowedEmail Module Documentation

## Overview

The AllowedEmail module provides functionality to manage a whitelist of email addresses that are permitted to access the system. This acts as an additional layer of access control beyond Firebase authentication, allowing administrators to control exactly which users can register and log in.

## Components

### 1. AllowedEmail Model (Prisma Schema)

```prisma
model AllowedEmail {
  id          String   @id @default(uuid())
  email       String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?
}
```

### 2. AllowedEmailService

The service layer that provides methods for managing allowed emails:

- `findAll()`: Retrieves all allowed emails, ordered by creation date
- `findOne(id)`: Retrieves a specific allowed email by ID
- `findByEmail(email)`: Retrieves an allowed email by email address
- `create(data)`: Creates a new allowed email
- `update(id, data)`: Updates an existing allowed email
- `delete(id)`: Deletes an allowed email
- `isEmailAllowed(email)`: Checks if an email is in the allowlist

### 3. AllowedEmailController

The controller exposes REST API endpoints for managing allowed emails:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/allowed-emails` | List all allowed emails |
| GET | `/allowed-emails/:id` | Get a specific allowed email |
| POST | `/allowed-emails` | Create a new allowed email |
| PUT | `/allowed-emails/:id` | Update an allowed email |
| DELETE | `/allowed-emails/:id` | Delete an allowed email |

### 4. Data Transfer Objects (DTOs)

#### CreateAllowedEmailDto

```typescript
export class CreateAllowedEmailDto {
  @ApiProperty({
    description: 'The email address to allow',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Optional description for this allowed email',
    example: 'Marketing team member',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID of the admin who created this entry',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
```

#### UpdateAllowedEmailDto

```typescript
export class UpdateAllowedEmailDto {
  @ApiProperty({
    description: 'The email address to allow',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Optional description for this allowed email',
    example: 'Marketing team member',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
```

## Integration with Authentication

The AllowedEmail module is integrated with the authentication system to ensure that only users with allowed emails can log in. This integration is implemented in the `AuthService`:

```typescript
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
```

## Usage Examples

### Adding a New Allowed Email

```typescript
// In a service or controller
const newAllowedEmail = await this.allowedEmailService.create({
  email: 'user@example.com',
  description: 'New team member',
  createdBy: 'admin-user-id',
});
```

### Checking if an Email is Allowed

```typescript
// In a service or controller
const isAllowed = await this.allowedEmailService.isEmailAllowed('user@example.com');

if (isAllowed) {
  // Proceed with authentication
} else {
  // Reject access
}
```

## Security Considerations

1. **Access Control**: Only administrators should have access to manage allowed emails. This is enforced through role-based access control.

2. **Email Validation**: All email addresses are validated using class-validator to ensure they are properly formatted.

3. **Audit Trail**: The `createdBy` field tracks which administrator added each allowed email, providing accountability.

4. **Case Sensitivity**: Email addresses are stored and compared in lowercase to prevent case-sensitivity issues.

## Future Enhancements

1. **Bulk Operations**: Add support for bulk import/export of allowed emails.

2. **Domain Allowlisting**: Allow entire domains to be whitelisted (e.g., `@company.com`).

3. **Expiration Dates**: Add support for temporary access with expiration dates.

4. **Audit Logging**: Implement detailed audit logging for all operations on allowed emails. 