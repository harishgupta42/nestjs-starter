import * as crypto from 'crypto';
import * as _ from 'lodash';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UtilsService {
  private logger = new Logger(UtilsService.name);
  omitData(key: string, value: any) {
    return ['password', 'otp', 'token'].indexOf(key) > -1
      ? typeof key === 'object'
        ? JSON.parse(JSON.stringify(key, this.omitData))
        : undefined
      : value;
  }

  generateRandomString(length: number) {
    return crypto.randomBytes(20).toString('hex').substring(0, length);
  }

  generateOtp() {
    if (process.env.NODE_ENV === 'development') return 123456;
    return Math.floor(Math.random() * (Math.floor(999999) - Math.ceil(100000)) + Math.ceil(100000));
  }

  camelize(obj: any) {
    return _.transform(obj, (acc: { [x: string]: any }, value: any, key: string, target: any) => {
      const camelKey = _.isArray(target) ? key : _.camelCase(key as string);

      acc[camelKey] = _.isObject(value) ? this.camelize(value) : value;
    });
  }
}
