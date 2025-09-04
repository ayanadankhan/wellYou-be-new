import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobPosting,  } from '../job-position/schemas/job-position.schema';

import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';
import { Application } from '../application/schemas/application.schema';
import { IJobPostingDocument } from '../job-position/interfaces/job-position.interface';
import { ICandidateProfileDocument } from '../candidate-profile/interfaces/candidate-profile.interface';
import { IApplicationDocument } from '../application/interfaces/application.interface';
import { JobPostingService } from '../job-position/job-position.service'; // To use its findOne method
import { CandidateProfileService } from '../candidate-profile/candidate-profile.service'; // To use its findOne method

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectModel(JobPosting.name) private readonly jobPositionModel: Model<IJobPostingDocument>,
    @InjectModel(CandidateProfile.name) private readonly candidateProfileModel: Model<ICandidateProfileDocument>,
    @InjectModel(Application.name) private readonly applicationModel: Model<IApplicationDocument>,
    private readonly jobPositionService: JobPostingService ,
    private readonly candidateProfileService: CandidateProfileService,
  ) {}

  /**
   * Ranks applicants for a specific job based on a simple matching algorithm.
   * This is a basic version and can be significantly enhanced.
   * @param jobPositionId The ID of the job position to rank applicants for.
   * @returns A list of applications with a calculated matchScore, sorted descending.
   */
  async rankApplicantsForJob(jobPositionId: string): Promise<{ application: IApplicationDocument; matchScore: number }[]> {
    this.logger.log(`[AUDIT] Starting applicant ranking for Job Position ID: ${jobPositionId}`);

    const jobPosition = await this.jobPositionService.findOne(jobPositionId);
    if (!jobPosition) {
      this.logger.error(`[AUDIT] Job Position with ID '${jobPositionId}' not found. Aborting ranking.`);
      throw new NotFoundException(`Job Position with ID '${jobPositionId}' not found.`);
    }
    this.logger.debug(`[AUDIT] Found Job Position: ${jobPosition.title} (ID: ${jobPosition._id})`);
    // this.logger.debug(`[AUDIT] Job Requirements: ${JSON.stringify(jobPosition.requirements)}`);
    this.logger.debug(`[AUDIT] Job Experience Level: ${jobPosition.experienceLevel}`);
    this.logger.debug(`[AUDIT] Job Location: ${jobPosition.location}`);
    this.logger.debug(`[AUDIT] Job Type: ${jobPosition.jobType}`);


    const applications = await this.applicationModel
      .find({ jobPosition: new Types.ObjectId(jobPositionId), isDeleted: false })
      .populate('candidateProfile')
      .exec();

    this.logger.log(`[AUDIT] Found ${applications.length} applications for job ${jobPositionId}.`);

    const rankedApplications: { application: IApplicationDocument; matchScore: number }[] = [];

    for (const app of applications) {
      const candidateName = (app.candidateProfile as any)?.candidateName || 'Unknown Candidate';
      this.logger.log(`\n--- [AUDIT] Processing Application ID: ${app._id} for Candidate: ${candidateName} ---`);

      if (!app.candidateProfile) {
        this.logger.warn(`[AUDIT] Application ${app._id} has no associated candidate profile. Skipping.`);
        continue;
      }

      const candidateProfile = app.candidateProfile as unknown as ICandidateProfileDocument;
      let currentMatchScore = 0;
      this.logger.debug(`[AUDIT] Candidate Profile ID: ${candidateProfile._id}`);
      this.logger.debug(`[AUDIT] Candidate Overall Experience Years: ${candidateProfile.overallExperienceYears}`);
      this.logger.debug(`[AUDIT] Candidate General Skills: ${JSON.stringify(candidateProfile.generalSkills)}`);
      this.logger.debug(`[AUDIT] Application Specific Skills: ${JSON.stringify(app.skills)}`);
      this.logger.debug(`[AUDIT] Candidate Location: ${candidateProfile.location}`);
      this.logger.debug(`[AUDIT] Candidate Preferred Job Titles: ${JSON.stringify(candidateProfile.preferredJobTitles)}`);
      this.logger.debug(`[AUDIT] Initial matchScore for ${candidateName}: ${currentMatchScore}`);

      // --- Simple Matching Logic Calculation ---
      // const jobSkills = jobPosition.requirements || [];
      const candidateGeneralSkills = candidateProfile.generalSkills || [];
      const applicationSpecificSkills = app.skills || [];
      const allCandidateSkills = new Set([...candidateGeneralSkills, ...applicationSpecificSkills]);
      this.logger.debug(`[AUDIT] Combined Candidate Skills for matching: ${JSON.stringify(Array.from(allCandidateSkills))}`);

      // Skill Match
      let skillMatchPoints = 0;
      // jobSkills.forEach(jobSkill => {
      //   if (allCandidateSkills.has(jobSkill)) {
      //     skillMatchPoints += 10;
      //     this.logger.debug(`[AUDIT] Skill Match: '${jobSkill}' found. Adding 10 points.`);
      //   } else {
      //     this.logger.debug(`[AUDIT] Skill Mismatch: '${jobSkill}' not found.`);
      //   }
      // });
      currentMatchScore += skillMatchPoints;
      this.logger.debug(`[AUDIT] Score after Skill Match: ${currentMatchScore} (Added ${skillMatchPoints} points)`);


      // Experience Level Match
      let experiencePoints = 0;
      if (candidateProfile.overallExperienceYears) {
        if (jobPosition.experienceLevel === 'SENIOR' && candidateProfile.overallExperienceYears >= 5) {
          experiencePoints = 20;
          this.logger.debug(`[AUDIT] Experience Match: Job 'SENIOR', Candidate ${candidateProfile.overallExperienceYears} years (>=5). Adding 20 points.`);
        } else if (jobPosition.experienceLevel === 'MID_LEVEL' && candidateProfile.overallExperienceYears >= 2 && candidateProfile.overallExperienceYears < 5) {
          experiencePoints = 10;
          this.logger.debug(`[AUDIT] Experience Match: Job 'MID_LEVEL', Candidate ${candidateProfile.overallExperienceYears} years (>=2 and <5). Adding 10 points.`);
        } else if (jobPosition.experienceLevel === 'ENTRY_LEVEL' && candidateProfile.overallExperienceYears < 2) {
          experiencePoints = 5;
          this.logger.debug(`[AUDIT] Experience Match: Job 'ENTRY_LEVEL', Candidate ${candidateProfile.overallExperienceYears} years (<2). Adding 5 points.`);
        } else {
          this.logger.debug(`[AUDIT] Experience Mismatch: Candidate experience (${candidateProfile.overallExperienceYears} years) does not fit job level '${jobPosition.experienceLevel}'.`);
        }
      } else {
          this.logger.debug(`[AUDIT] Experience Mismatch: Candidate overallExperienceYears is null/undefined.`);
      }
      currentMatchScore += experiencePoints;
      this.logger.debug(`[AUDIT] Score after Experience Level Match: ${currentMatchScore} (Added ${experiencePoints} points)`);


      // Location Match
      let locationPoints = 0;
      if (jobPosition.location && candidateProfile.location) {
        // if (jobPosition.location === candidateProfile.location) {
        //   locationPoints = 5;
        //   this.logger.debug(`[AUDIT] Location Match: Job ('${jobPosition.location}') and Candidate ('${candidateProfile.location}') match. Adding 5 points.`);
        // } else {
        //   this.logger.debug(`[AUDIT] Location Mismatch: Job ('${jobPosition.location}') and Candidate ('${candidateProfile.location}') do not match.`);
        // }
      } else {
          this.logger.debug(`[AUDIT] Location Match: One or both locations are missing.`);
      }
      currentMatchScore += locationPoints;
      this.logger.debug(`[AUDIT] Score after Location Match: ${currentMatchScore} (Added ${locationPoints} points)`);


      // Job Type Match
      let jobTypePoints = 0;
      if (jobPosition.jobType && candidateProfile.preferredJobTitles?.some(title => title.includes(jobPosition.jobType))) {
        jobTypePoints = 5;
        this.logger.debug(`[AUDIT] Job Type Match: Job type '${jobPosition.jobType}' found in candidate's preferred job titles. Adding 5 points.`);
      } else {
        this.logger.debug(`[AUDIT] Job Type Mismatch: Job type '${jobPosition.jobType}' not found in candidate's preferred job titles.`);
      }
      currentMatchScore += jobTypePoints;
      this.logger.debug(`[AUDIT] Final Calculated Match Score for ${candidateName}: ${currentMatchScore}`);

      // --- End of Matching Logic ---

      // Update the matchScore in the application document
      if (app.matchScore !== currentMatchScore) {
        this.logger.log(`[AUDIT] Persisting Match Score: Old score ${app.matchScore} vs New calculated score ${currentMatchScore} for Application ID ${app._id}.`);
        app.matchScore = currentMatchScore;
        await app.save(); // Save the updated application document
        this.logger.debug(`[AUDIT] Successfully saved updated matchScore for application ${app._id} to ${currentMatchScore}`);
      } else {
        this.logger.debug(`[AUDIT] Match Score for Application ID ${app._id} is unchanged (${currentMatchScore}). No database write performed.`);
      }

      rankedApplications.push({ application: app, matchScore: currentMatchScore });
    }

    this.logger.log(`[AUDIT] Sorting ${rankedApplications.length} applicants by matchScore in descending order.`);
    rankedApplications.sort((a, b) => b.matchScore - a.matchScore);
    this.logger.log(`[AUDIT] Finished ranking applicants for job ${jobPositionId}.`);

    // Log the final ranked list for audit purposes (names and scores)
    this.logger.log(`[AUDIT] --- Final Ranked Applicants for Job ${jobPositionId} ---`);
    rankedApplications.forEach((item, index) => {
        const candidateName = (item.application.candidateProfile as any)?.candidateName || 'Unknown';
        this.logger.log(`[AUDIT] Priority ${index + 1}: ${candidateName} (Score: ${item.matchScore})`);
    });
    this.logger.log(`[AUDIT] ---------------------------------------------------`);

    return rankedApplications;
  }

  // ... (recommendJobsForCandidate method remains unchanged for this request)
  async recommendJobsForCandidate(candidateProfileId: string): Promise<{ jobPosition: IJobPostingDocument; suitabilityScore: number }[]> {
    this.logger.log(`Recommending jobs for Candidate Profile ID: ${candidateProfileId}`);

    const candidateProfile = await this.candidateProfileService.findOne(candidateProfileId);
    if (!candidateProfile) {
      throw new NotFoundException(`Candidate Profile with ID '${candidateProfileId}' not found.`);
    }

    const jobPositions = await this.jobPositionModel.find({ isActive: true, isDeleted: false }).exec();

    const recommendedJobs: { jobPosition: IJobPostingDocument; suitabilityScore: number }[] = [];

    const candidateGeneralSkills = candidateProfile.generalSkills || [];
    const candidateExperienceYears = candidateProfile.overallExperienceYears || 0;
    const candidateLocation = candidateProfile.location?.toLowerCase();

    for (const job of jobPositions) {
      let suitabilityScore = 0;

      // const jobRequirements = job.requirements || [];
      // jobRequirements.forEach(reqSkill => {
      //   if (candidateGeneralSkills.includes(reqSkill)) {
      //     suitabilityScore += 10;
      //   }
      // });

      if (job.experienceLevel === 'SENIOR' && candidateExperienceYears >= 5) {
        suitabilityScore += 20;
      } else if (job.experienceLevel === 'MID_LEVEL' && candidateExperienceYears >= 2 && candidateExperienceYears < 5) {
        suitabilityScore += 10;
      } else if (job.experienceLevel === 'ENTRY_LEVEL' && candidateExperienceYears < 2) {
        suitabilityScore += 5;
      }

      // if (job.location && candidateLocation && job.location.toLowerCase() === candidateLocation) {
      //   suitabilityScore += 5;
      // }

      if (job.jobType && candidateProfile.preferredJobTitles?.some(title => title.includes(job.jobType))) {
        suitabilityScore += 5;
      }

      recommendedJobs.push({ jobPosition: job, suitabilityScore });
    }

    recommendedJobs.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    this.logger.log(`Finished recommending ${recommendedJobs.length} jobs for candidate ${candidateProfileId}.`);
    return recommendedJobs;
  }
}