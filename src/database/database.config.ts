// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  // Debug environment variables
  console.log('🔍 Environment Variables Debug:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('MONGO_URI:', process.env.MONGO_URI ? `Set (${process.env.MONGO_URI})` : 'Not set');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? `Set (${process.env.MONGODB_URI})` : 'Not set');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? `Set (${process.env.DATABASE_URL})` : 'Not set');
  
  // List all environment variables containing 'MONGO' or 'DATABASE'
  const relevantEnvVars = Object.keys(process.env).filter(key =>
    key.toUpperCase().includes('MONGO') || key.toUpperCase().includes('DATABASE')
  );
  console.log('📋 All MongoDB-related env vars:', relevantEnvVars);
  
  // Priority order for MongoDB URI
  const mongoUri = process.env.MONGO_URI || 
                  process.env.MONGODB_URI || 
                  process.env.DATABASE_URL ||
                  'mongodb://127.0.0.1:27017/adan-hrm';
  
  console.log('🎯 Selected MongoDB URI:', mongoUri);
  
  return {
    uri: mongoUri,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      retryAttempts: 3,
      retryDelay: 2000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30010,
    }
  };
});