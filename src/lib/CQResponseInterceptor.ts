import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class CommandResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse() as Response;
    const req = context.switchToHttp().getRequest() as Request;
    return next.handle().pipe(map(data => {
        res.status( data?.status || req.url.includes('/queries/') ? 200 : 201);
        return data;
    }));
  }
}