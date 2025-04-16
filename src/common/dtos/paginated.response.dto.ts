import { ApiProperty } from "@nestjs/swagger";
import { IsArray } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { ToBoolean } from "../helpers/functions.utils";
export class PageMetaDto {
  readonly page: number;

  readonly take: number;

  readonly itemCount: number;

  readonly pageCount: number;

  readonly hasPreviousPage: boolean;

  readonly hasNextPage: boolean;

  constructor({ pageOptionsDto, itemCount }: PageMetaDtoParameters) {
    if (pageOptionsDto.fetchAll) {
      this.page = 1;
      this.take = itemCount;
      this.itemCount = itemCount;
      this.pageCount = 1;
      this.hasPreviousPage = false;
      this.hasNextPage = false;
      return;
    }

    this.page = pageOptionsDto.page;
    this.take = pageOptionsDto.take;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}

export class PaginatedResponseDto<T> {
  @IsArray()
  @ApiProperty({ isArray: true })
  readonly payload: T[];

  @ApiProperty({ type: () => PageMetaDto })
  readonly meta: PageMetaDto;

  constructor(payload: T[], meta: PageMetaDto) {
    this.payload = payload;
    this.meta = meta;
  }
}

export interface PageMetaDtoParameters {
  pageOptionsDto: PageOptionsDto;
  itemCount: number;
}

export enum Order {
  ASC = "asc",
  DESC = "desc",
}

export class PageOptionsDto {
  @ApiPropertyOptional({ enum: Order, default: Order.ASC })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly take?: number = 5;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @ToBoolean()
  readonly fetchAll?: boolean = false;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
