import { INestApplication, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Response } from 'express';

import { ConnectionModule } from '../connection/connection.module';
import { CredentialDefinitionModule } from '../credential-definition/credential-definition.module';
import { TenantModule } from '../tenant/tenant.module';
import { TenantUserModule } from '../tenant-user/tenant-user.module';

const tenantSwagger = {
  name: 'tenant',
  title: 'Tenant API',
  description: 'API endpoints for tenant and tenant user management',
  version: '1.0',
  modules: [TenantModule, TenantUserModule, CredentialDefinitionModule],
};

const vcSwagger = {
  name: 'vc',
  title: 'VC Operations API',
  description: 'API endpoints for VC operations',
  version: '1.0',
  modules: [ConnectionModule],
};

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
    this.setupCustomDocumentation(
      app,
      tenantSwagger.name,
      tenantSwagger.title,
      tenantSwagger.description,
      tenantSwagger.version,
      tenantSwagger.modules,
    );
    this.setupCustomDocumentation(
      app,
      'vc',
      'VC Operations API',
      'API endpoints for VC operations',
      '1.0',
      [ConnectionModule],
    );
  }

  /**
   * Setup only the JSON endpoints for both full and tenant documentation
   */
  private static setupJsonEndpoints(app: INestApplication): void {
    this.setupFullDocumentationJson(app);
    this.setupCustomDocumentationJson(
      app,
      tenantSwagger.name,
      tenantSwagger.title,
      tenantSwagger.description,
      tenantSwagger.version,
      tenantSwagger.modules,
    );
    this.setupCustomDocumentationJson(
      app,
      vcSwagger.name,
      vcSwagger.title,
      vcSwagger.description,
      vcSwagger.version,
      vcSwagger.modules,
    );
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
  private static setupCustomDocumentation(
    app: INestApplication,
    name: string,
    title: string,
    description: string,
    version: string,
    modules: Array<Type<unknown>> = [TenantModule, TenantUserModule],
  ): void {
    const config = new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      include: modules,
    });

    SwaggerModule.setup(`api/docs/${name}`, app, document);

    this.setupCustomDocumentationJson(
      app,
      name,
      title,
      description,
      version,
      modules,
      document,
    );
  }

  /**
   * Setup the tenant-specific API documentation JSON endpoint
   */
  private static setupCustomDocumentationJson(
    app: INestApplication,
    name: string,
    title: string,
    description: string,
    version: string,
    modules: Array<Type<unknown>> = [TenantModule, TenantUserModule],
    document?: ReturnType<typeof SwaggerModule.createDocument>,
  ): void {
    const config = new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .build();

    const docToUse =
      document ||
      SwaggerModule.createDocument(app, config, {
        include: modules,
      });

    // Expose JSON endpoint
    app
      .getHttpAdapter()
      .get(`/api/docs/${name}/json`, (_req: unknown, res: Response) => {
        res.json(docToUse);
      });
  }
}
