import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { CommandError } from './CommandError';

@Catch()
export class CQExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let newCommandError: CommandError;

        if (exception && typeof exception == 'object' 
            && Object.keys(exception).includes('success')
            && Object.keys(exception).includes('message')
            && Object.keys(exception).includes('code')
        ) {
            // object like command error
            newCommandError = exception as any;
        } else if (exception instanceof CommandError) {
            // command error instance
            newCommandError = exception as CommandError;
        } else if (exception instanceof HttpException) {
            // catch native nestjs exceptions
            const httpException = exception as HttpException;
            const response = httpException.getResponse();
            const code = (response as any)?.error as string || 'HTTP_ERROR';
            newCommandError = new CommandError(httpException.message, code, httpException, exception.getStatus());
        } else if (Array.isArray(exception) && exception[0] instanceof ValidationError) {
            // catch class vlidator exceptions
            newCommandError = new CommandError('Invalid payload ،،،!', 'VALIDATION_ERROR', exception, HttpStatus.BAD_REQUEST);
        } else if ((exception as any).message) {
            newCommandError = new CommandError((exception as any).message, (exception as any).code || 'UNKNOWN_ERROR', exception);
        } else {
            newCommandError = new CommandError('Unkown error occired ،،،!', 'UNSPECIFIED_ERROR');
        }

        response.status(newCommandError.getStatus()).json({
            success: false,
            message: newCommandError.message,
            code: newCommandError.code,
            data: newCommandError.data,
        });
    }
}
