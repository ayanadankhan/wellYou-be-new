import { Body, Controller, Post, Res, HttpStatus, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { TestResumeDto } from './dto/test-resume.dto';
import { Response } from 'express';

const execPromise = promisify(exec);

@Controller('test-extraction')
export class TestExtractionController {
    private readonly logger = new Logger(TestExtractionController.name);

    @Post('process-resume')
    async processResume(@Body() body: TestResumeDto, @Res() res: Response) {
        this.logger.log(`Received request to process resume URL: ${body.resumeUrl}`);

        // Set the script path as relative to the project root.
        const scriptPath = 'pdf_to_text_service.py';

        try {
            // Use 'exec' to handle paths with spaces more reliably.
            // The command string explicitly wraps the script path in quotes.
            const command = `python3 "${scriptPath}" "${body.resumeUrl}"`;
            this.logger.log(`Executing command: ${command}`);

            const { stdout, stderr } = await execPromise(command, { timeout: 60000 });
            
            if (stderr) {
                this.logger.error(`Python script stderr: ${stderr}`);
            }

            // The Python script is designed to print a single JSON object to stdout
            const result = JSON.parse(stdout);
            
            this.logger.log('Successfully processed resume. Sending JSON response.');
            return res.status(HttpStatus.OK).json(result);

        } catch (error) {
            this.logger.error(`Failed to execute Python script or parse output: ${error.message}`);
            
            // Check if the error is due to an invalid URL or other BadRequest
            if (error.message.includes('HTTP Error')) {
                throw new BadRequestException(`Failed to download PDF from URL: ${body.resumeUrl}. Please check the URL.`);
            }

            // Generic error for script execution or parsing issues
            throw new InternalServerErrorException(`An unexpected error occurred during resume processing: ${error.message}`);
        }
    }
}
