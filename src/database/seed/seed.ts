// src/database/seed/seed.ts (main entry point)
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  console.log('🌱 Starting database seeding...');
  
  try {
    const app = await NestFactory.create(SeedModule, {
      logger: ['error', 'warn', 'log'], // Enable logging to see what's happening
    });
    
    const seedService = app.get(SeedService);
    
    // Manually trigger the seeding process
    await seedService.onModuleInit();
    console.log('✅ Database seeding completed successfully!');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start seeding process:', error);
  process.exit(1);
});