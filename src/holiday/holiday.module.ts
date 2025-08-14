import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HolidayService } from './holiday.service';
import { HolidayController } from './holiday.controller';
import { Holiday, HolidaySchema } from './entities/holiday.entity';
import { WeekendConfiguration, WeekendConfigurationSchema } from './entities/weekend-configuration.entity';
import { WeekendConfigurationController } from './weekend-configuration.controller';
import { WeekendConfigurationService } from './weekend-configuration.service';

@Module({
  imports: [

    MongooseModule.forFeature([{ name: Holiday.name, schema: HolidaySchema },
    { name: WeekendConfiguration.name, schema: WeekendConfigurationSchema }, // Register the new schema
    ]),
  ],
  controllers: [HolidayController, WeekendConfigurationController], // Add the new controller
  providers: [HolidayService, WeekendConfigurationService], // Add the new service
  exports: [HolidayService, WeekendConfigurationService], // Export if needed by other modules
})
export class HolidayModule { }
