import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
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
import { Department } from '../departments/entities/department.entity';
import { Designation } from '../designations/entities/designation.entity';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectModel(Employee.name) private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(User.name) private readonly userModel: Model<any>,
    @InjectModel(Department.name) private readonly departmentModel: Model<Department>,
    @InjectModel(Designation.name) private readonly designationModel: Model<Designation>,
    private userService: UserService,
  ) {}

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

          const createdUser : any = await this.userService.create(createUserDto);
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

  async findAll (getDto: GetEmployeeDto): Promise<{ count: number; list: GetEmployeeDto[] }> {
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

  async generateEmployeeReport(tenantId: string) {
  const employees = await this.employeeModel
    .find({ tenantId })
    .populate('userId', 'firstName lastName')
    .lean();

    const departments = await this.departmentModel.find().lean();
    const designations = await this.designationModel.find().lean();

    const departmentMap = new Map<string, any>();
    departments.forEach((d: any) => departmentMap.set(String(d._id), d));

    const designationMap = new Map<string, any>();
    designations.forEach((d: any) => designationMap.set(String(d._id), d));

    const statusStats = { ACTIVE: 0, INACTIVE: 0, TERMINATED: 0 };
    const newHires: any[] = [];
    const upcomingBirthdays: any[] = [];
    const departmentStats: Record<string, number> = {};
    const designationStats: Record<string, number> = {};
    const contractEmployees: any[] = [];
    const remoteEmployees: any[] = [];

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    employees.forEach((employee: any) => {
      const status = (employee.employmentStatus || 'INACTIVE') as 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
      statusStats[status] = (statusStats[status] || 0) + 1;

      const hireDate = new Date(employee.hireDate);
      if (hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear) {
        newHires.push(employee);
      }

      if ((employee.employmentType || '') === 'CONTRACT') {
        contractEmployees.push(employee);
      }

      if ((employee.employmentType || '') === 'REMOTE') {
        remoteEmployees.push(employee);
      }

      const dept = departmentMap.get(String(employee.departmentId));
      if (dept?.departmentName) {
        departmentStats[dept.departmentName] = (departmentStats[dept.departmentName] || 0) + 1;
      }

      const desg = designationMap.get(String(employee.positionId));
      if (desg?.title) {
        designationStats[desg.title] = (designationStats[desg.title] || 0) + 1;
      }

      const dob = new Date(employee.dateOfBirth);
      if (
        dob.getMonth() === currentDate.getMonth() &&
        dob.getDate() >= currentDate.getDate()
      ) {
      upcomingBirthdays.push({
        name:
          (employee.userId?.firstName || '') +
          ' ' +
          (employee.userId?.lastName || 'Unnamed'),
        date: dob.toISOString().split('T')[0],
      });
      }
    });

      const next30Days = new Date();
      next30Days.setDate(currentDate.getDate() + 30);

      const certificationsExpiringSoon: any[] = [];

      employees.forEach((employee: any) => {
        (employee.certifications || []).forEach((cert: any) => {
          const expiry = new Date(cert.expirationDate);

          // Check if expiry is within the next 30 days
          if (expiry >= currentDate && expiry <= next30Days) {
            certificationsExpiringSoon.push({
              employeeName: `${employee.userId?.firstName || ''} ${employee.userId?.lastName || ''}`.trim() || 'Unnamed',
              certName: cert.name || 'No Certification Name',
              expirationDate: expiry.toISOString().split('T')[0], // YYYY-MM-DD
            });
          }
        });
      });

    const profileStats = await this.calculateProfileCompletionStats(employees);

    const missingDocumentsCount = employees.filter(
      (e) => !e.documents || e.documents.length === 0
    ).length;

    const currentMonthHires = await this.getCurrentMonthHires(tenantId);
    const currentMonthLeavers = await this.getCurrentMonthLeavers(tenantId);

    return {
      totalEmployees: employees.length,
      activeEmployees: statusStats.ACTIVE,
      inactiveEmployees: statusStats.INACTIVE,
      terminatedEmployees: statusStats.TERMINATED,
      contractEmployees: contractEmployees.length,
      remoteEmployees: remoteEmployees.length,
      employeesPerDepartment: Object.entries(departmentStats).map(([departmentName, count]) => ({ departmentName, count })),
      employeesPerDesignation: Object.entries(designationStats).map(([designationName, count]) => ({ designationName, count })),
      averageProfileCompletion: profileStats.averageCompletion,
      incompleteProfiles: profileStats.incompleteProfiles,
      topCompletedProfiles: profileStats.topProfiles,
      certificationsExpiringSoon,
      upcomingBirthdays,
      missingDocuments: missingDocumentsCount,
      openJobs: 0,
      currentMonthHires,
      currentMonthLeavers
    };
  }

  private calculateProfileCompletionStats(employees: any[]) {
    const totalEmployees = employees.length;

    if (totalEmployees === 0) {
      return {
        averageCompletion: 0,
        incompleteProfiles: 0,
        topProfiles: [],
      };
    }

    const totalProgressSum = employees.reduce(
      (sum, e) => sum + (e.progress?.totalProgress || 0),
      0
    );
    const average = Math.round(totalProgressSum / totalEmployees);

    const incomplete = employees.filter(
      e => (e.progress?.totalProgress || 0) < 100
    ).length;

    const topProfiles = employees
      .filter(e => typeof e.progress?.totalProgress === 'number')
      .sort((a, b) => (b.progress?.totalProgress || 0) - (a.progress?.totalProgress || 0))
      .slice(0, 3)
      .map(e => ({
        name: `${e.userId?.firstName || ''} ${e.userId?.lastName || 'Unnamed'}`.trim(),
        progress: e.progress?.totalProgress || 0,
      }));

    return {
      averageCompletion: average,
      incompleteProfiles: incomplete,
      topProfiles,
    };
  }

  private async getCurrentMonthHires(tenantId: string) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const hires = await this.employeeModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          hireDate: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lte: new Date(currentYear, currentMonth + 1, 0)
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'designations',
          localField: 'positionId',
          foreignField: '_id',
          as: 'position'
        }
      },
      { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'reportingTo',
          foreignField: '_id',
          as: 'reportingUser'
        }
      },
      { $unwind: { path: '$reportingUser', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: {
            $trim: {
              input: { $concat: ['$user.firstName', ' ', '$user.lastName'] }
            }
          },
          email: '$user.email',
          departmentName: '$department.departmentName',
          designationTitle: '$position.title',
          profilePicture: 1,
          location: 1,
          phoneNumber: 1,
          reportingToName: {
            $trim: {
              input: { $concat: ['$reportingUser.firstName', ' ', '$reportingUser.lastName'] }
            }
          },
          hireDate: 1
        }
      }
    ]);

    return hires;
  }

  private async getCurrentMonthLeavers(tenantId: string) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const leavers = await this.employeeModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          employmentStatus: { $in: ['TERMINATED', 'RETIRED', 'RESIGNED'] },
          updatedAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lte: new Date(currentYear, currentMonth + 1, 0)
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'designations',
          localField: 'positionId',
          foreignField: '_id',
          as: 'position'
        }
      },
      { $unwind: { path: '$position', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'reportingTo',
          foreignField: '_id',
          as: 'reportingUser'
        }
      },
      { $unwind: { path: '$reportingUser', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: {
            $trim: {
              input: { $concat: ['$user.firstName', ' ', '$user.lastName'] }
            }
          },
          email: '$user.email',
          departmentName: '$department.departmentName',
          designationTitle: '$position.title',
          profilePicture: 1,
          location: 1,
          phoneNumber: 1,
          reportingToName: {
            $trim: {
              input: { $concat: ['$reportingUser.firstName', ' ', '$reportingUser.lastName'] }
            }
          },
          employmentStatus: 1,
        }
      }
    ]);

    return leavers;
  }
}