import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class Guest {
  @ApiProperty({ description: "Guest unique identifier" })
  id: string;

  @ApiProperty({ description: "Guest name" })
  name: string;

  @ApiPropertyOptional({ description: "Guest email" })
  email: string | null;

  @ApiProperty({ description: "Guest phone number" })
  phone: string;

  @ApiProperty({ description: "Guest tags/categories", type: [String] })
  tags: string[];

  @ApiPropertyOptional({ description: "Notes about the guest" })
  notes: string | null;

  @ApiProperty({ description: "Number of visits" })
  visitCount: number;

  @ApiPropertyOptional({ description: "Date of last visit" })
  lastVisit: Date | null;

  @ApiPropertyOptional({
    description: "Preferred seating (window, booth, etc.)",
  })
  preferredSeating: string | null;

  @ApiProperty({ description: "Dining preferences", type: [String] })
  diningPreferences: string[];

  @ApiProperty({ description: "Dietary restrictions", type: [String] })
  dietaryRestrictions: string[];

  @ApiPropertyOptional({ description: "Allergies information" })
  allergies: string | null;

  @ApiProperty({ description: "Whether the guest is a VIP" })
  isVip: boolean;

  @ApiProperty({ description: "Restaurant ID this guest belongs to" })
  restaurantId: string;

  @ApiProperty({ description: "Creation date" })
  createdAt: Date;

  @ApiProperty({ description: "Last update date" })
  updatedAt: Date;
}
