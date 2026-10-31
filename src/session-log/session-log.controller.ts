import { Controller } from '@nestjs/common';

import { SessionLogService } from './session-log.service';

@Controller('session-log')
export class SessionLogController {
  constructor(private readonly sessionLogService: SessionLogService) {}
}
