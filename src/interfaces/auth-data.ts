import { deviceTypeEnum, userType } from '../constants/app.constants';

export interface AuthData {
  _id: string | any;
  deviceType: deviceTypeEnum;
  deviceToken: string;
  ipAddress: string;
  type?: userType;
}
