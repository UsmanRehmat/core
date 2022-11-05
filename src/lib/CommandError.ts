import { HttpException, HttpStatus } from '@nestjs/common';
import { CommandResponse } from '@h-platform/cqm'

export class CommandError extends HttpException {
    success: boolean = false;
    
    constructor(readonly message: string, readonly code: string, readonly data: any = {}, status: number = 500) {
        super(CommandResponse.error(message, code, data), status);
        this.name = 'CommandError';
    }
    
    getHttpResponse(): any {
        return CommandResponse.error(this.message, this.code, this.data);
    }
}
