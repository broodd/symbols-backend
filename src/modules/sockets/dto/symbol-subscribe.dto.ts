import { PickType } from '@nestjs/swagger';

import { CreateSymbolDto } from 'src/modules/symbols/dto/crud';

/**
 * Used for subscribe/unsubscribe Client to/from Symbol
 */
export class SymbolSubscribeDto extends PickType(CreateSymbolDto, ['providerSymbol']) {}
