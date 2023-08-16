import { IsString } from 'class-validator';

export interface ICallbackQuery {
  readonly code: string;
  readonly state: string;
}

export abstract class CallbackQueryDto implements ICallbackQuery {
  @IsString()
  public code: string;

  @IsString()
  public state: string;
}
