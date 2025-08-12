import { Injectable, HttpException, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/Employee.schema';
import { CreateEmployeeDto } from './dto/create-Employee.dto';
import { UpdateEmployeeDto } from './dto/update-Employee.dto';
import { GetEmployeeDto } from './dto/get-Employee.dto';
import { isValidObjectId } from 'mongoose';
import { plainToClass } from 'class-transformer';
import { InjectModel as InjectUserModel } from '@nestjs/mongoose';
import { User } from '../tenant/users/schemas/user.schema';
import { UserService } from '../tenant/users/user.service';
import { CreateUserDto } from '../tenant/users/dto/create-user.dto';
import { requestMangmentervice } from '../request-mangment/request-mangment.service';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(User.name) private readonly userModel: Model<any>,
    private userService: UserService,
  ) { }

  async create(createEmployeeDto: CreateEmployeeDto): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Creating employee with data: ${JSON.stringify(createEmployeeDto)}`);

      const createUserDto = new CreateUserDto();
      createUserDto.firstName = createEmployeeDto.firstName;
      createUserDto.lastName = createEmployeeDto.lastName;
      createUserDto.email = createEmployeeDto.email;
      createUserDto.password = createEmployeeDto.password;
      createUserDto.role = createEmployeeDto.role;
      createUserDto.tenantId = createEmployeeDto.tenantId.toString();
      createUserDto.permissions = createEmployeeDto.permissions;

      const createdUser: any = await this.userService.create(createUserDto);
      this.logger.log(`User created with ID: ${createdUser._id}`);

      const employeeData = {
        ...createEmployeeDto,
        userId: createdUser._id.toString()
      };

      const employee = new this.employeeModel(employeeData);
      const savedEmployee = await employee.save();

      return plainToClass(GetEmployeeDto, savedEmployee.toObject());
    } catch (error) {
      this.logger.error(`Failed to create employee: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to create employee',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(getDto: GetEmployeeDto): Promise<{ count: number; list: GetEmployeeDto[] }> {
    try {
      this.logger.log(`🔍 Aggregation filter: ${JSON.stringify(getDto)}`);

      const matchStage: any = {};

      if (getDto.userId) {
        matchStage.userId = new Types.ObjectId(getDto.userId);
      }

      if (getDto.departmentId) {
        matchStage.departmentId = new Types.ObjectId(getDto.departmentId);
      }

      if (getDto.positionId) {
        matchStage.positionId = new Types.ObjectId(getDto.positionId);
      }

      if (getDto.employmentStatus) {
        matchStage.employmentStatus = getDto.employmentStatus;
      } else {
        matchStage.employmentStatus = 'ACTIVE';
      }

      if (getDto.tenantId) {
        matchStage.tenantId = new Types.ObjectId(getDto.tenantId);
      }

      const pipeline: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      ];

      if (getDto.name) {
        const nameRegex = new RegExp(getDto.name, 'i');

        pipeline.push({
          $match: {
            $or: [
              { 'user.firstName': { $regex: nameRegex } },
              { 'user.lastName': { $regex: nameRegex } },
              {
                $expr: {
                  $regexMatch: {
                    input: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
                    regex: nameRegex,
                  },
                },
              },
            ],
          },
        });
      }

      const commonPipeline = [
        ...pipeline,
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'designations',
            localField: 'positionId',
            foreignField: '_id',
            as: 'position',
          },
        },
        { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'reportingTo',
            foreignField: '_id',
            as: 'reportingTo',
          },
        },
        { $unwind: { path: '$reportingTo', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            'progress.totalProgress': {
              $round: [
                {
                  $avg: [
                    '$progress.basicInfo',
                    '$progress.personalInfo',
                    '$progress.education',
                    '$progress.certification',
                    '$progress.employment',
                    '$progress.experience',
                    '$progress.skills',
                    '$progress.documents'
                  ]
                },
                0
              ]
            }
          }
        },
        {
          $project: {
            'user.password': 0,
          },
        }
      ];

      if (getDto.sb) {
        const sortDirection = getDto.sd === '1' ? 1 : -1;
        commonPipeline.push({ $sort: { [getDto.sb]: sortDirection } });
      }

      const [list, countQuery] = await Promise.all([
        this.employeeModel.aggregate([
          ...commonPipeline,
          { $skip: Number(getDto.o) || 0 },
          { $limit: Number(getDto.l) || 10 },
        ]).exec(),
        this.employeeModel.aggregate([...commonPipeline, { $count: 'total' }]).exec(),
      ]);

      this.logger.log(`✅ Retrieved ${list.length} employees via aggregation`);
      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      this.logger.error(`❌ Aggregation failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch employees via aggregation',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findEmployeeIdByUserId(userId: string): Promise<string | null> {
    try {
      this.logger.log(`Searching for employee ID with userId: ${userId}`);
      this.logger.log(`UserId type: ${typeof userId}, length: ${userId.length}`);

      const mongoose = require('mongoose');

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        this.logger.warn(`Invalid ObjectId format: ${userId}`);
        return null;
      }

      const userObjectId = new mongoose.Types.ObjectId(userId);
      this.logger.log(`Converted userId to ObjectId: ${userObjectId}`);

      const employee = await this.employeeModel.findOne({
        userId: userObjectId
      }).select('_id userId');

      if (!employee) {
        this.logger.warn(`No employee found with userId: ${userId}`);

        // Debug: Let's check what employees exist
        const totalEmployees = await this.employeeModel.countDocuments();
        this.logger.log(`Total employees in collection: ${totalEmployees}`);

        if (totalEmployees > 0) {
          // Get a sample employee to see the data structure
          const sampleEmployee = await this.employeeModel.findOne().select('_id userId');

          // Check if any employee has this userId (even with different types)
          const employeeWithStringUserId = await this.employeeModel.findOne({
            userId: userId // Try as string
          }).select('_id userId');

          this.logger.log(`Employee found with string userId: ${employeeWithStringUserId ? 'Yes' : 'No'}`);
        }

        return null;
      }

      this.logger.log(`Employee found - _id: ${employee._id}, userId: ${employee.userId}`);
      return employee._id.toString();

    } catch (error) {
      this.logger.error(`Error finding employee ID for userId ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<GetEmployeeDto> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Fetching employee with ID: ${id}`);

      const employee = await this.employeeModel.aggregate([
        { $match: { _id: new Types.ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'positions',
            localField: 'positionId',
            foreignField: '_id',
            as: 'position',
          },
        },
        { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'reportingTo',
            foreignField: '_id',
            as: 'reportingTo',
          },
        },
        { $unwind: { path: '$reportingTo', preserveNullAndEmptyArrays: true } },
        { $project: { 'user.password': 0 } },
        { $limit: 1 }
      ]);

      if (!employee || employee.length === 0) {
        this.logger.warn(`Employee with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Employee with ID ${id} retrieved successfully`);
      return plainToClass(GetEmployeeDto, employee[0]);
    } catch (error) {
      this.logger.error(`Failed to fetch employee with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch employee',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByUserId(userId: string): Promise<GetEmployeeDto> {
    try {
      this.logger.log(`Fetching employee with userId: ${userId}`);

      const employee = await this.employeeModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentId',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'designations',
            localField: 'positionId',
            foreignField: '_id',
            as: 'position',
          },
        },
        { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'reportingTo',
            foreignField: '_id',
            as: 'reportingTo',
          },
        },
        { $unwind: { path: '$reportingTo', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'salaries',
            localField: '_id',
            foreignField: 'employeesId',
            as: 'salary',
          },
        },
        { $unwind: { path: '$salary', preserveNullAndEmptyArrays: true } },
        { $project: { 'user.password': 0 } },
        { $limit: 1 }
      ]);

      if (!employee || employee.length === 0) {
        this.logger.warn(`Employee with userId ${userId} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with userId ${userId} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Employee with userId ${userId} retrieved successfully`);
      return plainToClass(GetEmployeeDto, employee[0]);
    } catch (error) {
      this.logger.error(`Failed to fetch employee with userId ${userId}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch employee',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<GetEmployeeDto> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Updating employee with ID: ${id}`);

      if (
        'reportingTo' in updateEmployeeDto &&
        (!updateEmployeeDto.reportingTo || !isValidObjectId(updateEmployeeDto.reportingTo))
      ) {
        delete updateEmployeeDto.reportingTo;
      }

      const existingEmployee = await this.employeeModel.findById(id).exec();

      if (!existingEmployee) {
        this.logger.warn(`Employee with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (updateEmployeeDto.progress && existingEmployee.progress) {
        updateEmployeeDto.progress = {
          ...existingEmployee.progress,
          ...updateEmployeeDto.progress,
        };
      }

      const updateData = { ...updateEmployeeDto };

      if (updateEmployeeDto.skills && Array.isArray(updateEmployeeDto.skills)) {
        const existingSkills = existingEmployee.skills || [];
        const skillMap = new Map();

        existingSkills.forEach(skill => {
          const skillDto = {
            name: skill.name,
            level: skill.level
          };
          skillMap.set(skill.name, skillDto);
        });

        updateEmployeeDto.skills.forEach(skill => {
          skillMap.set(skill.name, skill);
        });

        updateData.skills = Array.from(skillMap.values());
      }

      if (updateEmployeeDto.certifications && Array.isArray(updateEmployeeDto.certifications)) {
        const existingCertifications = existingEmployee.certifications || [];
        const certificationMap = new Map();

        existingCertifications.forEach(cert => {
          const certDto = {
            id: cert.id,
            name: cert.name,
            issuingOrganization: cert.issuingOrganization,
            issueDate: cert.issueDate ? cert.issueDate.toISOString() : undefined,
            expirationDate: cert.expirationDate ? cert.expirationDate.toISOString() : undefined,
            credentialId: cert.credentialId,
            verificationUrl: cert.verificationUrl,
            hasNoExpiration: cert.hasNoExpiration,
            description: cert.description
          };
          const key = cert.id || cert.name;
          certificationMap.set(key, certDto);
        });

        updateEmployeeDto.certifications.forEach(cert => {
          const key = cert.id || cert.name;
          certificationMap.set(key, cert);
        });

        updateData.certifications = Array.from(certificationMap.values());
      }

      // Merge education array with deduplication and type conversion
      if (updateEmployeeDto.education && Array.isArray(updateEmployeeDto.education)) {
        const existingEducation = existingEmployee.education || [];
        const educationMap = new Map();

        // Add existing education (convert Date to string)
        existingEducation.forEach(edu => {
          const eduDto = {
            id: edu.id,
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: edu.startDate ? edu.startDate.toISOString() : undefined,
            endDate: edu.endDate ? edu.endDate.toISOString() : undefined,
            gpa: edu.gpa,
            honors: edu.honors,
            isEnrolled: edu.isEnrolled,
            description: edu.description
          };
          const key = edu.id || `${edu.institution}-${edu.degree}`;
          educationMap.set(key, eduDto);
        });

        // Add/update new education
        updateEmployeeDto.education.forEach(edu => {
          const key = edu.id || `${edu.institution}-${edu.degree}`;
          educationMap.set(key, edu);
        });

        updateData.education = Array.from(educationMap.values());
      }

      // Merge experiences array with deduplication and type conversion
      if (updateEmployeeDto.experiences && Array.isArray(updateEmployeeDto.experiences)) {
        const existingExperiences = existingEmployee.experiences || [];
        const experienceMap = new Map();

        // Add existing experiences (convert Date to string)
        existingExperiences.forEach(exp => {
          const expDto = {
            id: exp.id,
            companyName: exp.companyName,
            position: exp.position,
            startDate: exp.startDate ? exp.startDate.toISOString() : undefined,
            endDate: exp.endDate ? exp.endDate.toISOString() : undefined,
            isCurrentRole: exp.isCurrentRole,
            description: exp.description,
            location: exp.location,
            employmentType: exp.employmentType,
            achievements: exp.achievements
          };
          const key = exp.id || `${exp.companyName}-${exp.position}`;
          experienceMap.set(key, expDto);
        });

        // Add/update new experiences
        updateEmployeeDto.experiences.forEach(exp => {
          const key = exp.id || `${exp.companyName}-${exp.position}`;
          experienceMap.set(key, exp);
        });

        updateData.experiences = Array.from(experienceMap.values());
      }

      // Merge documents array with deduplication
      if (updateEmployeeDto.documents && Array.isArray(updateEmployeeDto.documents)) {
        const existingDocuments = existingEmployee.documents || [];
        const documentMap = new Map();

        // Add existing documents
        existingDocuments.forEach(doc => {
          const docDto = {
            type: doc.type,
            name: doc.name,
            url: doc.url
          };
          const key = `${doc.type}-${doc.name}`;
          documentMap.set(key, docDto);
        });

        // Add/update new documents
        updateEmployeeDto.documents.forEach(doc => {
          const key = `${doc.type}-${doc.name}`;
          documentMap.set(key, doc);
        });

        updateData.documents = Array.from(documentMap.values());
      }

      // Merge dependent members array with deduplication and type conversion
      if (updateEmployeeDto.dependentMembers && Array.isArray(updateEmployeeDto.dependentMembers)) {
        const existingDependents = existingEmployee.dependentMembers || [];
        const dependentMap = new Map();

        // Add existing dependents (convert Date to string)
        existingDependents.forEach(dep => {
          const depDto = {
            name: dep.name,
            relation: dep.relation,
            dateOfBirth: dep.dateOfBirth ? dep.dateOfBirth.toISOString() : undefined
          };
          const key = `${dep.name}-${dep.relation}`;
          dependentMap.set(key, depDto);
        });

        // Add/update new dependents
        updateEmployeeDto.dependentMembers.forEach(dep => {
          const key = `${dep.name}-${dep.relation}`;
          dependentMap.set(key, dep);
        });

        updateData.dependentMembers = Array.from(dependentMap.values());
      }

      // ✅ Update employee with merged data
      const updatedEmployee = await this.employeeModel
        .findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .exec();

      this.logger.log(`Employee with ID ${id} updated successfully`);

      return plainToClass(GetEmployeeDto, updatedEmployee?.toObject());
    } catch (error) {
      this.logger.error(`Failed to update employee with ID ${id}: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to update employee',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: string): Promise<GetEmployeeDto> {
    try {
      if (!isValidObjectId(id)) {
        this.logger.warn(`Invalid MongoDB ObjectID: ${id}`);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid ID',
            message: `Provided ID ${id} is not a valid MongoDB ObjectID`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.log(`Deleting employee with ID: ${id}`);
      const deletedEmployee = await this.employeeModel.findByIdAndDelete(id).exec();
      if (!deletedEmployee) {
        this.logger.warn(`Employee with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Employee not found',
            message: `Employee with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Employee with ID ${id} deleted successfully`);
      return plainToClass(GetEmployeeDto, deletedEmployee.toObject());
    } catch (error) {
      this.logger.error(`Failed to delete employee with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to delete employee',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

async getEmployeeFullDetails(
  employeeId: string
): Promise<{
  basicInfo: {
    name: string;
    email: string;
    departmentId: any;
    departmentName?: string;
    positionId: any;
    positionTitle?: string;
    hireDate: Date;
    employmentType: string;
    employmentStatus: string;
    profilePicture: string;
    location: string;
    gender: string;
    dateOfBirth: Date;
    phoneNumber: string;
    nationality: string;
    maritalStatus: string;
    manager: string | null;
  };
  attendances: any[];
  requests: any[];
  salaries: any[];
  otherDetails: {
    emergencyContact: any;
    dependentMembers: any[];
    certifications: any[];
    skills: any[];
  };
}> {
  const employee = await this.employeeModel
    .findById(employeeId)
    // populate core user info
    .populate({
      path: 'userId',
      model: 'User',
      select: 'firstName lastName email',
      strictPopulate: false,
    })
    // populate manager info
    .populate({
      path: 'reportingTo',
      model: 'User',
      select: 'firstName lastName email',
      strictPopulate: false,
    })
    // populate department info
    .populate({
      path: 'departmentId',
      model: 'Department',
      select: 'departmentName',
      strictPopulate: false,
    })
    // populate position/designation info
    .populate({
      path: 'positionId',
      model: 'Designation',
      select: 'title',
      strictPopulate: false,
    })
    // populate attendances
    .populate({
      path: 'attendances',
      model: 'Attendance',
      strictPopulate: false,
    })
    // populate requests
    .populate({
      path: 'requests',
      model: 'RequestManagement',
      strictPopulate: false,
    })
    // populate salaries
    .populate({
      path: 'salaries',
      model: 'Salary',
      strictPopulate: false,
    })
    .lean<{
      userId?: { firstName?: string; lastName?: string; email?: string };
      reportingTo?: { firstName?: string; lastName?: string; email?: string };
      departmentId: { _id: any; departmentName?: string } | any;
      positionId: { _id: any; title?: string } | any;
      hireDate: Date;
      employmentType: string;
      employmentStatus: string;
      profilePicture: string;
      location: string;
      gender: string;
      dateOfBirth: Date;
      phoneNumber: string;
      nationality: string;
      maritalStatus: string;
      attendances: any[];
      requests: any[];
      salaries: any[];
      emergencyContact: any;
      dependentMembers: any[];
      certifications: any[];
      skills: any[];
    }>();

  if (!employee) {
    throw new NotFoundException(`Employee with ID ${employeeId} not found`);
  }

  const { userId, reportingTo, departmentId, positionId, ...rest } = employee;

  return {
    basicInfo: {
      name: `${userId?.firstName || ''} ${userId?.lastName || ''}`.trim(),
      email: userId?.email || '',
      departmentId: departmentId?._id || departmentId,
      departmentName: departmentId?.departmentName || null,
      positionId: positionId?._id || positionId,
      positionTitle: positionId?.title || null,
      hireDate: rest.hireDate,
      employmentType: rest.employmentType,
      employmentStatus: rest.employmentStatus,
      profilePicture: rest.profilePicture,
      location: rest.location,
      gender: rest.gender,
      dateOfBirth: rest.dateOfBirth,
      phoneNumber: rest.phoneNumber,
      nationality: rest.nationality,
      maritalStatus: rest.maritalStatus,
      manager: reportingTo
        ? `${reportingTo.firstName || ''} ${reportingTo.lastName || ''}`.trim()
        : null,
    },
    attendances: rest.attendances || [],
    requests: rest.requests || [],
    salaries: rest.salaries || [],
    otherDetails: {
      emergencyContact: rest.emergencyContact,
      dependentMembers: rest.dependentMembers,
      certifications: rest.certifications,
      skills: rest.skills,
    },
  };
}



}
