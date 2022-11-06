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
            // const httpException = exception as HttpException;
            const response = exception.getResponse();
            const status = exception.getStatus()
            const code = exception.name;
            newCommandError = new CommandError(exception.message, code, response, status);
        } else if (Array.isArray(exception) && exception[0] instanceof ValidationError) {
            // catch class vlidator exceptions
            newCommandError = new CommandError('Invalid payload ،،،!', 'INVALID_PAYLOAD', exception, HttpStatus.BAD_REQUEST);
        } else if ((exception as any).message) {
            // handling simple Error(message)
            // here is sql related error / http axios error / simple errors
            newCommandError = new CommandError((exception as any).message, (exception as any).code || 'UNKNOWN_ERROR', exception);
        } else {
            newCommandError = new CommandError('Unkown error occured ،،،!', 'UNSPECIFIED_ERROR');
        }

        const statusCode = newCommandError.getStatus ? newCommandError.getStatus() : 500;
        response.status(statusCode).json({
            success: false,
            message: newCommandError.message,
            code: newCommandError.code,
            data: newCommandError.data,
        });
    }
}
