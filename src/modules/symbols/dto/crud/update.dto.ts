import { PartialType } from '@nestjs/swagger';

import { CreateSymbolDto } from './create.dto';

/**
 * [description]
 */
export class UpdateSymbolDto extends PartialType(CreateSymbolDto) {}
