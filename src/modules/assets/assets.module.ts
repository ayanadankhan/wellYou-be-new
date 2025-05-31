
import { Module } from '@nestjs/common';
import { AssetController } from './assets.controller';
import { AssetService } from './assets.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Asset, AssetSchema } from './schemas/assets.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Asset.name, schema: AssetSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [AssetController],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
