// 3. Your existing seed/seed.service.ts (with small improvements):
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@/modules/tenant/users/schemas/user.schema';
import { Company } from '@/modules/tenant/companies/schemas/company.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const shouldSeed = this.configService.get<string>('SHOULD_SEED') === 'true';

    // Allow seeding in development or when explicitly enabled
    if (nodeEnv === 'development' || shouldSeed) {
      this.logger.log('🌱 Starting database seeding process...');
      
      try {
        await this.seedDefaultCompany();
        await this.seedSuperAdmin();
        this.logger.log('✅ Database seeding process completed successfully.');
      } catch (error) {
        this.logger.error('❌ Database seeding failed:', error);
        throw error;
      }
    } else {
      this.logger.log('⏭️  Skipping database seeding (not in development environment or SHOULD_SEED is false).');
    }
  }

  private async seedSuperAdmin() {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    const firstName = this.configService.get<string>('SUPER_ADMIN_FIRST_NAME') || 'Super';
    const lastName = this.configService.get<string>('SUPER_ADMIN_LAST_NAME') || 'Admin';

    if (!email || !password) {
      this.logger.warn('⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env. Skipping super admin seeding.');
      return;
    }

    try {
      let superAdmin = await this.userModel.findOne({ 
        email, 
        role: UserRole.SUPER_ADMIN 
      });

      if (!superAdmin) {
        this.logger.log('👤 Super admin user not found. Creating...');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        superAdmin = await this.userModel.create({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: UserRole.SUPER_ADMIN,
          isActive: true,
          tenantId: null, // Super admin is not tied to a specific tenant
        });
        
        this.logger.log(`✅ Super admin user created successfully with email: ${superAdmin.email}`);
      } else {
        this.logger.log('✅ Super admin user already exists. Skipping creation.');
      }
    } catch (error) {
      this.logger.error('❌ Error seeding super admin:', error);
      throw error;
    }
  }

  private async seedDefaultCompany() {
    const companyName = this.configService.get<string>('DEFAULT_COMPANY_NAME') || 'Default Company';
    
    try {
      let defaultCompany = await this.companyModel.findOne({ name: companyName });

      if (!defaultCompany) {
        this.logger.log('🏢 Default company not found. Creating...');
        defaultCompany = await this.companyModel.create({
          name: companyName,
          address: '123 Main St, Anytown',
          phone: '+1234567890',
          email: 'info@defaultcompany.com',
          isActive: true,
        });
        this.logger.log(`✅ Default company created successfully: ${defaultCompany.name}`);
      } else {
        this.logger.log('✅ Default company already exists. Skipping creation.');
      }
    } catch (error) {
      this.logger.error('❌ Error seeding default company:', error);
      throw error;
    }
  }
}