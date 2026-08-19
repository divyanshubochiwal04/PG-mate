import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('PG Mate API')
    .setDescription('Enterprise-grade PG & Hostel Operations REST API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'bearer-auth'
    )
    .addTag('Discovery', 'Public discovery and informational endpoints')
    .addTag('System Health', 'Health check and connectivity endpoints')
    .addTag('Authentication', 'User registration, login, token refresh, and session management')
    .addTag('Organizations', 'Multi-tenant organization profiles')
    .addTag('Physical Inventory', 'Properties, buildings, floors, rooms, beds, and facilities')
    .addTag('Residents', 'Resident onboarding, stay allocations, and lifecycle')
    .addTag('Commercial', 'Commercial pricing plans and rent schedules')
    .addTag('Mess', 'Mess meal subscriptions, menus, and attendance')
    .addTag('Billing', 'Invoicing, ledger transactions, and offline/online payments')
    .addTag('Tasks', 'Housekeeping and maintenance task tracking')
    .addTag('Notifications', 'System notifications')
    .addTag('Reporting', 'Operational, financial, and occupancy reports')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'PG Mate API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
