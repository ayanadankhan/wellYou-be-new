import { ApiProperty } from '@nestjs/swagger';

export class CreateAnswerSurveyDto {
  @ApiProperty()
  surveyId: string;

  @ApiProperty({
    type: [Object],
    example: [{ questionId: 'questionId1', answer: '4' }],
  })
  answers: {
    questionId: string;
    answer: string;
  }[];

  @ApiProperty()
  token: string;
}