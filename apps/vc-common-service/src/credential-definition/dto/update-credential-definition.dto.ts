import { PartialType } from '@nestjs/mapped-types';

import { CreateCredentialDefinitionDto } from './create-credential-definition.dto';

export class UpdateCredentialDefinitionDto extends PartialType(
  CreateCredentialDefinitionDto,
) {}
