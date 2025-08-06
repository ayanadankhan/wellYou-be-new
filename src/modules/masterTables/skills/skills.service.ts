import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { GetSkillDto } from './dto/get-skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectModel(Skill.name) private readonly skillModel: Model<Skill>,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    const createdSkill = new this.skillModel(createSkillDto);
    return createdSkill.save();
  }

  async findAll(getDto: GetSkillDto) {
    try {
      const pipeline: any[] = [];

      if (getDto.s) {
        pipeline.push({ $match: { name: new RegExp(getDto.s, 'i') } });
      }

      if (getDto.skillType) {
        pipeline.push({ $match: { skillType: getDto.skillType } });
      }

      const [list, countQuery] = await Promise.all([
        this.skillModel.aggregate([
          ...pipeline,
          { $sort: { [getDto.sb]: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ]).exec(),
        this.skillModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve skills');
    }
  }

  async findOne(id: string): Promise<Skill> {
    const skill = await this.skillModel.findById(id).exec();
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    return skill;
  }

  async update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    const updatedSkill = await this.skillModel
      .findByIdAndUpdate(id, updateSkillDto, { new: true })
      .exec();
      
    if (!updatedSkill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    return updatedSkill;
  }

  async remove(id: string): Promise<Skill> {
    const deletedSkill = await this.skillModel.findByIdAndDelete(id).exec();
    if (!deletedSkill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    return deletedSkill;
  }

}