import { instanceToPlain, plainToInstance } from 'class-transformer';

import { FindManyOptionsDto } from './find-many-options.dto';

describe('FindManyOptionsDto', () => {
  it('should be defined', () => {
    expect(new FindManyOptionsDto()).toBeDefined();
  });

  describe('sort', () => {
    it('should be return array asc', () => {
      const plain = { asc: ['id'] };
      const classDto = plainToInstance(FindManyOptionsDto, plain);
      const instanceDto = instanceToPlain(classDto);
      expect(instanceDto).toMatchObject({
        sort: {
          id: 1,
        },
      });
    });

    it('should be return array desc', () => {
      const plain = { desc: ['id'] };
      const classDto = plainToInstance(FindManyOptionsDto, plain);
      const instanceDto = instanceToPlain(classDto);
      expect(instanceDto).toMatchObject({
        sort: {
          id: -1,
        },
      });
    });

    it('should be return array desc ( priority case )', () => {
      const plain = { asc: ['id'], desc: ['id'] };
      const classDto = plainToInstance(FindManyOptionsDto, plain);
      const instanceDto = instanceToPlain(classDto);
      expect(instanceDto).toMatchObject({
        sort: {
          id: -1,
        },
      });
    });
  });
});
