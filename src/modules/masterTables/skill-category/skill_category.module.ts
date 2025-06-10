import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SkillCategory, SkillCategorySchema } from './schemas/skill_category.schema';
import { SkillCategoryService } from './skill_category.service';
import { SkillCategoryController } from './skill_category.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: SkillCategory.name, schema: SkillCategorySchema }])],
  controllers: [SkillCategoryController],
  providers: [SkillCategoryService],
})
export class SkillCategoryModule {}
