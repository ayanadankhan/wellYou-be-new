import { forwardRef, Module } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { UploadController } from "./upload.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { UploadTemp, UploadTempSchema } from "./entities/upload.entity";
import { SharedModule } from "src/modules/shared/shared.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UploadTemp.name, schema: UploadTempSchema }]),
    SharedModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService]
})
export class UploadModule {}
