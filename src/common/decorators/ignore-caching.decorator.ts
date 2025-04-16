import { SetMetadata } from "@nestjs/common";
import { IGNORE_CACHING_META } from "../constants";

export const IgnoreCaching = () => SetMetadata(IGNORE_CACHING_META, true);
