import { IsOptional, IsString } from 'class-validator';

export class UpdateConnectorCredentialDto {
  @IsOptional()
  @IsString()
  public endpointUrl?: string;

  @IsOptional()
  public active?: boolean;

  @IsOptional()
  public keyVersion?: number;
}
