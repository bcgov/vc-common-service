import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateConnectorCredentialDto {
  @IsOptional()
  @IsString()
  public endpointUrl?: string;

  @IsOptional()
  @IsBoolean()
  public active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  public keyVersion?: number;
}
