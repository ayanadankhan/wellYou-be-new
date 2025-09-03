import { IsNotEmpty, IsUrl } from 'class-validator';

export class TestResumeDto {
  @IsNotEmpty({ message: 'The resumeUrl field cannot be empty.' })
  @IsUrl({}, { message: 'The provided resumeUrl is not a valid URL.' })
  resumeUrl: string;
}
