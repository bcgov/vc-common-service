import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Response } from 'express';

import { CredentialDefinitionModule } from '../credential-definition/credential-definition.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';

export class SwaggerService {
  /**
   * Setup Swagger documentation for the application
   */
  public static setupSwagger(
    app: INestApplication,
    configService: ConfigService,
  ): void {
    const swaggerEnabled: boolean =
      configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';
    const swaggerJsonEnabled: boolean =
      configService.get<string>('SWAGGER_JSON_ENABLED', 'true') === 'true';

    // If JSON-only mode is enabled, setup only JSON endpoints
    if (swaggerJsonEnabled && !swaggerEnabled) {
      this.setupJsonEndpoints(app);
      return;
    }

    // If Swagger is disabled and JSON-only is not enabled, skip setup
    if (!swaggerEnabled) {
      return;
    }

    // Full setup: UI + JSON endpoints
    this.setupFullDocumentation(app);
    this.setupTenantDocumentation(app);
  }

  /**
   * Setup only the JSON endpoints for both full and tenant documentation
   */
  private static setupJsonEndpoints(app: INestApplication): void {
    this.setupFullDocumentationJson(app);
    this.setupTenantDocumentationJson(app);
  }

  /**
   * Setup the full API documentation
   */
  private static setupFullDocumentation(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('VC Common Service API')
      .setDescription(
        'A comprehensive API for managing VC Common Service models. Provides functionality for credential lifecycle management, schema validation, and multi-tenant support.',
      )
      .setVersion('1.0')
      .addTag('vc-common-service')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    this.setupFullDocumentationJson(app, document);
  }

  /**
   * Setup the full API documentation JSON endpoint
   */
  private static setupFullDocumentationJson(
    app: INestApplication,
    document?: ReturnType<typeof SwaggerModule.createDocument>,
  ): void {
    const config = new DocumentBuilder()
      .setTitle('VC Common Service API')
      .setDescription(
        'A comprehensive API for managing VC Common Service models. Provides functionality for credential lifecycle management, schema validation, and multi-tenant support.',
      )
      .setVersion('1.0')
      .addTag('vc-common-service')
      .build();

    const docToUse = document || SwaggerModule.createDocument(app, config);

    // Expose JSON endpoint
    app
      .getHttpAdapter()
      .get('/api/docs/json', (_req: unknown, res: Response) => {
        res.json(docToUse);
      });
  }

  /**
   * Setup the tenant-specific API documentation
   */
  private static setupTenantDocumentation(app: INestApplication): void {
    const config = new DocumentBuilder()
      .setTitle('Tenant API')
      .setDescription('API endpoints for tenant and tenant user management')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      include: [TenantModule, TenantUserModule, CredentialDefinitionModule],
    });

    SwaggerModule.setup('api/docs/tenant', app, document);

    this.setupTenantDocumentationJson(app, document);
  }

  /**
   * Setup the tenant-specific API documentation JSON endpoint
   */
  private static setupTenantDocumentationJson(
    app: INestApplication,
    document?: ReturnType<typeof SwaggerModule.createDocument>,
  ): void {
    const config = new DocumentBuilder()
      .setTitle('Tenant API')
      .setDescription('API endpoints for tenant and tenant user management')
      .setVersion('1.0')
      .build();

    const docToUse =
      document ||
      SwaggerModule.createDocument(app, config, {
        include: [TenantModule, TenantUserModule],
      });

    // Expose JSON endpoint
    app
      .getHttpAdapter()
      .get('/api/docs/tenant/json', (_req: unknown, res: Response) => {
        res.json(docToUse);
      });
  }
}
