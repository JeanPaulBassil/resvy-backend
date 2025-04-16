import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY_META } from "../constants";

export const Public = () => SetMetadata(IS_PUBLIC_KEY_META, true);
