import { ApiProperty } from "@nestjs/swagger";

export class Restaurant {
  @ApiProperty({
    description: "The unique identifier of the restaurant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "The name of the restaurant",
    example: "Delicious Bites",
  })
  name: string;

  @ApiProperty({
    description: "The description of the restaurant",
    example: "A cozy restaurant serving Italian cuisine",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: "The address of the restaurant",
    example: "123 Main St, City, Country",
  })
  address: string;

  @ApiProperty({
    description: "The phone number of the restaurant",
    example: "+1234567890",
  })
  phone: string;

  @ApiProperty({
    description: "The email of the restaurant",
    example: "contact@deliciousbites.com",
  })
  email: string;

  @ApiProperty({
    description: "The ID of the user who owns this restaurant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  ownerId: string;

  @ApiProperty({
    description: "The date and time when the restaurant was created",
    example: "2023-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "The date and time when the restaurant was last updated",
    example: "2023-01-01T00:00:00.000Z",
  })
  updatedAt: Date;
}
