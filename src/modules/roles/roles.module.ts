
import { Module } from '@nestjs/common';
import { RoleController } from './roles.controller';
import { RoleService } from './roles.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Role, RoleSchema } from './schemas/roles.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
