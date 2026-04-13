import { FindOneOptionsDto } from 'src/common/dto';

import { SymbolEntity } from '../../entities';

/**
 * [description]
 */
export class SelectSymbolDto extends FindOneOptionsDto<SymbolEntity> {}
