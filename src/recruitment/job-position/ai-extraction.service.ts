import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { JobEnrichment, ExtractedSkill, IJobPostingDocument } from './interfaces/job-position.interface';
import { SkillLevel } from '../shared/enums';
import { GenerateJobDescriptionDto } from './dto/job-description.dto';
interface IExtractedResumeData {
  summary: string;
  extractedSkills: string[];
}
@Injectable()
export class AiExtractionService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Replace with your key
    });
  }

  async extractJobData(description: string): Promise<Partial<JobEnrichment>> {
    try {
      const prompt = `
Analyze this job description and extract structured data. Return ONLY valid JSON:

Job Description:
${description}

Extract:
{
  "skills": [{"name": "skill_name", "level": "ENTRY|INTERMEDIATE|ADVANCED|EXPERT", "minYears": 0, "required": true, "confidence": 0.9}],
  "jobFunction": "ENGINEERING|SALES|MARKETING|HR|FINANCE|OPERATIONS",
  "industry": "TECHNOLOGY|HEALTHCARE|FINANCE|RETAIL|MANUFACTURING",
  "benefits": ["benefit1", "benefit2"],
  "keywords": ["keyword1", "keyword2"],
  "softSkills": ["Communication", "Problem-solving"],
  "urgency": "LOW|STANDARD|HIGH|URGENT",
  "confidence": 0.85
}

Focus on technical skills with accurate experience levels.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const extracted = JSON.parse(content);

      // Validate and format skills
      if (extracted.skills) {
        extracted.skills = extracted.skills.map((skill: any) => ({
          name: skill.name,
          level: this.validateSkillLevel(skill.level),
          minYears: skill.minYears || 0,
          required: skill.required !== false,
          confidence: Math.min(skill.confidence || 0.8, 1.0)
        }));
      }

      return {
        confidence: Math.min(extracted.confidence || 0.8, 1.0),
        skills: extracted.skills || [],
        jobFunction: extracted.jobFunction || 'OPERATIONS',
        industry: extracted.industry || 'TECHNOLOGY',
        benefits: extracted.benefits || [],
        keywords: extracted.keywords || [],
        softSkills: extracted.softSkills || [],
        urgency: extracted.urgency || 'STANDARD'
      };

    } catch (error) {
      console.error('AI extraction error:', error);

      // Fallback extraction using regex/keywords
      return this.fallbackExtraction(description);
    }
  }

  async generateJobDescription(generateDto: GenerateJobDescriptionDto): Promise<string> {
    const { title, companyName, keySkills, responsibilities, benefits, experienceLevel, jobType, workplaceType, baseDescription } = generateDto;

    const prompt = `
You are a world-class technical recruiter and AI content strategist. Your task is to write a modern, comprehensive, and professional job description for the position below. The description should be engaging, informative, and optimized for both human candidates and AI-driven platforms.

**Role Details:**
- **Job Title:** ${title}
- **Company:** ${companyName}
- **Experience Level:** ${experienceLevel}
- **Job Type:** ${jobType}
- **Workplace Type:** ${workplaceType}

**Instructions:**
1.  **Opening Hook:** Start with a compelling opening paragraph that captures the attention of top talent. Briefly describe the company's mission and the role's overall impact.
2.  **What You'll Do (Key Responsibilities):** Provide a bulleted list of core responsibilities. Focus on the day-to-day tasks and the strategic impact the role will have. Use action-oriented verbs.
3.  **What We're Looking For (Qualifications):**
    * Create a "Required" section for must-have skills and experiences.
    * Create a "Preferred" or "Bonus Points" section for desirable but not essential qualifications.
4.  **Benefits & Perks:** List the benefits in a clear, easy-to-read format. Highlight any unique perks or culture points.
5.  **Our Culture:** Write a brief paragraph about the company culture, the team they would be joining, and the opportunities for growth and professional development.
6.  **Call to Action:** End with a strong, inclusive call-to-action encouraging diverse candidates to apply.
7.  **Final Output:** Provide only the full job description text. Do not include any other commentary, headings, or markdown outside the description itself. Make the text rich with keywords, soft skills, and details that can be easily parsed for enrichment.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Using a more advanced model for better-quality content
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const generatedDescription = response.choices[0]?.message?.content;
      if (!generatedDescription) {
        throw new InternalServerErrorException('No response from AI for description generation.');
      }

      return generatedDescription;
    } catch (error) {
      console.error('AI description generation error:', error);
      throw new InternalServerErrorException('Failed to generate job description. Please try again.');
    }
  }

  private validateSkillLevel(level: string): SkillLevel {
    const validLevels = Object.values(SkillLevel);
    return validLevels.includes(level as SkillLevel) ? level as SkillLevel : SkillLevel.INTERMEDIATE;
  }

  private fallbackExtraction(description: string): Partial<JobEnrichment> {
    // Simple regex-based extraction as fallback
    const skills: ExtractedSkill[] = [];

    // Common tech skills patterns
    const skillPatterns = {
      'Node.js': /node\.?js/gi,
      'React': /react/gi,
      'Python': /python/gi,
      'JavaScript': /javascript|js\b/gi,
      'TypeScript': /typescript/gi,
      'MongoDB': /mongodb|mongo/gi,
      'SQL': /sql\b/gi,
      'Docker': /docker/gi,
      'Kubernetes': /kubernetes|k8s/gi,
      'AWS': /aws\b/gi,
    };

    for (const [skill, pattern] of Object.entries(skillPatterns)) {
      if (pattern.test(description)) {
        skills.push({
          name: skill,
          level: SkillLevel.INTERMEDIATE,
          required: true,
          confidence: 0.6
        });
      }
    }

    return {
      confidence: 0.6,
      skills,
      jobFunction: 'ENGINEERING',
      industry: 'TECHNOLOGY',
      benefits: [],
      keywords: [],
      softSkills: [],
      urgency: 'STANDARD'
    };
  }


async extractResumeData(resumePath: string): Promise<IExtractedResumeData> {
    

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume analyst. You will analyze a resume and extract key information in a structured JSON format.',
          },
          {
            role: 'user',
            content: `Analyze the resume at ${resumePath} and extract the following information in a JSON format:
                1. A professional summary of the candidate (string).
                2. An array of all technical and soft skills (string[]).
                Your response MUST be a valid JSON object matching the following structure:
                {
                  "summary": string,
                  "extractedSkills": string[]
                }`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const messageContent = completion.choices[0].message.content;
      if (typeof messageContent !== 'string') {
        
        return { summary: '', extractedSkills: [] };
      }

      const extractedData = JSON.parse(messageContent);

      if (!extractedData || typeof extractedData.summary !== 'string' || !Array.isArray(extractedData.extractedSkills)) {
        
        return { summary: '', extractedSkills: [] };
      }

      
      return extractedData;

    } catch (error) {
      
      return { summary: '', extractedSkills: [] };
    }
  }

  /**
   * Placeholder method to calculate a match score between extracted resume data and a job posting.
   * This logic would compare the extracted skills and other data points from the resume
   * against the job description and requirements.
   *
   * @param extractedData The data extracted from the candidate's resume.
   * @param jobPosting The job posting document.
   * @returns A promise that resolves to a match score between 0 and 100.
   */
  async calculateMatchScore(extractedData: IExtractedResumeData, jobPosting: IJobPostingDocument): Promise<number> {


    // In a real application, you might use an LLM for a more sophisticated comparison.
    // Example:
    // const prompt = `Calculate a match score (0-100) between this candidate's skills and the job description.
    // Candidate Skills: ${extractedData.extractedSkills.join(', ')}
    // Job Description: ${jobPosting.description}`
    // const response = await this.llmService.generateContent(prompt);
    // const score = this.parseScoreFromApiResponse(response);

    // Simple placeholder logic for demonstration
    let score = 0;
    // Replace 'jobPosting.skills' with the correct property that contains the skills array.
    // For example, if the property is 'jobEnrichment.skills', use:
    // const requiredSkills = jobPosting.jobEnrichment.skills.filter(s => s.level === 'required').map(s => s.name.toLowerCase());

    const requiredSkills = (jobPosting as any).skills
      ? (jobPosting as any).skills.filter((s: any) => s.level === 'required').map((s: any) => s.name.toLowerCase())
      : [];
    const extractedSkillsLower = extractedData.extractedSkills.map(s => s.toLowerCase());

    const matchedRequiredSkills = requiredSkills.filter((skill: string) => extractedSkillsLower.includes(skill));
    const skillMatchPercentage = (matchedRequiredSkills.length / requiredSkills.length) * 100;

    // Apply some weighting (e.g., more weight to skill match)
    score = skillMatchPercentage * 0.8;

    return Math.min(100, Math.round(score));
  }


}
