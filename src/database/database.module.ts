import { Module, Logger } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

const logger = new Logger('MongoDB');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<MongooseModuleOptions> => {
        const uri = configService.get<string>('MONGO_DB_URI');
        
        if (!uri) {
          logger.error('MongoDB URI not configured');
          throw new Error('MongoDB URI not found in configuration');
        }

        logger.log(`Initializing MongoDB connection to ${uri.replace(/:([^/]+)@/, ':*****@')}`);

        return {
          uri,
          retryAttempts: 3,
          retryDelay: 1000,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 30010,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              logger.log('MongoDB connected successfully');
            });
            connection.on('error', (error: Error) => {
              logger.error('MongoDB connection error', error);
            });            connection.on('disconnected', () => {
              logger.warn('MongoDB disconnected');
            });
            return connection;
          }
        };
      },      inject: [ConfigService],
    })
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}