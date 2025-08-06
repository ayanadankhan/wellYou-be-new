import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum SkillType {
  ENGINEERING = 'Engineering',
  DATA_SCIENCE = 'Data Science',
  GRAPHIC_DESIGN = 'Graphic Design',
  DIGITAL_MARKETING = 'Digital Marketing',
  PROJECT_MANAGEMENT = 'Project Management',
  UI_UX_DESIGN = 'UI/UX Design',
  CYBER_SECURITY = 'Cyber Security',
  CLOUD_COMPUTING = 'Cloud Computing',
  DEVOPS = 'DevOps',
  VIDEO_EDITING = 'Video Editing',
  CONTENT_WRITING = 'Content Writing',
  TRANSLATION = 'Translation',
  ACCOUNTING = 'Accounting',
  HUMAN_RESOURCES = 'Human Resources',
  CUSTOMER_SERVICE = 'Customer Service',
  SALES = 'Sales',
  NETWORK_ENGINEERING = 'Network Engineering',
  MACHINE_LEARNING = 'Machine Learning',
  BUSINESS_ANALYSIS = 'Business Analysis',
  GAME_DEVELOPMENT = 'Game Development'
}

@Schema({ timestamps: true })
export class Skill extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ 
    required: true, 
    enum: SkillType,
    default: SkillType.ENGINEERING 
  })
  skillType: SkillType;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);