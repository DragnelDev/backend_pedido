import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de excepciones.
 *
 * Centraliza el formato de todas las respuestas de error de la API
 * (tanto las HttpException lanzadas explícitamente como cualquier
 * error inesperado no controlado), evitando tener que formatear
 * la respuesta de error en cada controlador/servicio.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    // Normaliza el mensaje: puede venir como string, array (class-validator)
    // u objeto { message, error, statusCode }.
    let message: string | string[] = 'Error interno del servidor';
    let error: string | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      const body = exceptionResponse as Record<string, unknown>;
      message = (body.message as string | string[]) ?? message;
      error = body.error as string | undefined;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (!isHttpException) {
      // Solo se loguean con stack trace los errores no controlados (500),
      // para no ensuciar los logs con errores de negocio esperados (404, 400, etc.)
      this.logger.error(
        `${request.method} ${request.url} -> ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      error: error ?? HttpStatus[status] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
