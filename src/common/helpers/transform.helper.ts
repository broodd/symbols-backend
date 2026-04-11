import { plainToInstance, Transform } from 'class-transformer';

import { Type } from '@nestjs/common';

/**
 * Decorator in dto for transform from multipart boolean
 * @param classRef
 */
export function TransformAsJson(): PropertyDecorator {
  return Transform(({ key, obj }) => {
    try {
      return JSON.parse(obj[key]);
    } catch {
      return obj[key];
    }
  });
}

/**
 * Decorator in dto for transform from multipart json to instance
 * @param classRef
 */
export function TransformJsonTo<T>(classRef: Type<T>): PropertyDecorator {
  return Transform(({ value }) => {
    try {
      return plainToInstance(classRef, JSON.parse(value));
    } catch {
      return value;
    }
  });
}

/**
 * Transform array of string dot-notation to object
 * ['title', 'foo.bar', 'foo.other', 'foo.bar.sub.deep'] =>
 * {
 *  title: true,
 *  foo: {
 *    other: true,
 *    bar: {
 *      sub: {
 *        deep: true
 *      }
 *    }
 *  }
 * }
 * @param array
 * @param initialValue
 * @param initialObject
 */
export const stringArrayToNestedObject = (
  array: string[],
  initialValue: true | string | number = true,
  initialObject: any = {},
): Record<string, any> => {
  const result = initialObject;

  array.forEach((path) => {
    const keys = path.split('.');
    let current = result;

    keys.forEach((key, index) => {
      const isOnlyOneKey = keys.length === 1;
      const isMiddleKey = index >= 0 && index < keys.length - 1;
      const isLastKey = index === keys.length - 1;

      if (isOnlyOneKey) {
        if (current[key] === undefined) {
          current[key] = initialValue;
        }
        return;
      }

      if (isMiddleKey && typeof current[key] !== 'object') {
        current[key] = {};
        current = current[key];
        return;
      }

      if (current[key] === undefined) {
        current[key] = isLastKey ? initialValue : {};
      }

      current = current[key];
    });
  });

  return result;
};

/**
 * [description]
 * @param object
 * @param callback
 */
export const iterateAllKeysInNestedObject = (
  object: Record<string, any>,
  callback: (path: string) => void,
): void => {
  const recursiveIterate = (obj, path = '') => {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof obj[key] === 'object') {
        callback(currentPath);
        recursiveIterate(obj[key], currentPath);
      } else {
        callback(currentPath);
      }
    }
  };

  recursiveIterate(object);
};
