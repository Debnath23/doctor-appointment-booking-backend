import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SetCookiesInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const options = {
          httpOnly: true,
          secure: true,
          sameSite: 'none' as 'lax' | 'strict' | 'none',
          // path: '/',
        };

        if (data.accessToken) {
          response.cookie('accessToken', data.accessToken, options);
        }
        if (data.refreshToken) {
          response.cookie('refreshToken', data.refreshToken, options);
        }
      }),
    );
  }
}