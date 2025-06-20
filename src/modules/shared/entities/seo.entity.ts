import { Prop } from "@nestjs/mongoose";

export class Seo {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  keywords: string;
}