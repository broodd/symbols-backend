import basicAuth from '@fastify/basic-auth';

import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ConfigService } from './config';

const TOKENS_DESCRIPTION = `
##### 🔐 Authorization Tokens

Use the following *default* Bearer tokens depending on your role:

- **Admin** *067f2f3e-b936-4029-93d6-b2f58ae4f489*: 📋 Copy \n>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA2N2YyZjNlLWI5MzYtNDAyOS05M2Q2LWIyZjU4YWU0ZjQ4OSIsImlzRGV2Ijp0cnVlLCJpYXQiOjE3NTMxOTgwMDksImV4cCI6MTkxMDk4NjAwOX0.6rXjYtH9MuisI5gvhRcxTWucNRwsHXw3AC0wvXohuPU

- **User** *648fb3f0-ed5f-4177-99ab-9cab46bacd87*: 📋 Copy \n>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0OGZiM2YwLWVkNWYtNDE3Ny05OWFiLTljYWI0NmJhY2Q4NyIsImlzRGV2Ijp0cnVlLCJpYXQiOjE3NTMxOTgwMDl9.Ok-TydDnVIwwxPwJuVBLt8K2P2QgTfuFO9P1g0axwgY

Paste them into the 🔒 "Authorize" dialog above.
`;

/**
 * Setup swagger
 * @param configService
 */
export async function swaggerSetup(app: NestFastifyApplication, configService: ConfigService) {
  if (configService.get('SWAGGER_MODULE')) {
    const config = new DocumentBuilder()
      .setVersion(configService.get('npm_package_version'))
      .setTitle(configService.get('npm_package_name'))
      .setDescription(TOKENS_DESCRIPTION)
      .addBearerAuth()
      .addCookieAuth(
        'accessToken',
        {
          name: 'accessToken',
          type: 'apiKey',
          in: 'cookie',
        },
        'accessToken',
      )
      .addCookieAuth(
        'refreshToken',
        {
          name: 'refreshToken',
          type: 'apiKey',
          in: 'cookie',
        },
        'refreshToken',
      );

    const document = SwaggerModule.createDocument(app, config.build());
    const url = '/';

    SwaggerModule.setup(url, app, document, {
      swaggerOptions: {
        persistAuthorization: true, // 🔥 Keep JWT tokens after refreshing the page
        displayRequestDuration: true, // ⏳ Show request duration in Swagger UI
        tryItOutEnabled: true, // 🛠️ Enable "Try it out" by default
        filter: true, // 🔎 Add a search bar for API endpoints
        deepLinking: true, // 🔗 Allow direct links to specific API sections
        showExtensions: true, // 📌 Show extra metadata if available
        showCommonExtensions: true, // 🎯 Show common extensions in API docs
      },
    });

    if (configService.get('SWAGGER_LOGIN')) {
      const swaggerUsername = configService.get<string>('SWAGGER_USERNAME');
      const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');

      await app.register(basicAuth, {
        validate: (username, password, _req, _reply, done) =>
          username === swaggerUsername && password === swaggerPassword ? done() : done(new Error()),
        authenticate: true,
      });

      const instance: any = app.getHttpAdapter().getInstance();
      instance.addHook('onRequest', (request, reply, done) => {
        const [path] = request.url.split('?');
        const protectedPaths = [url, url + '-json', url + 'json'];

        if (protectedPaths.includes(path)) {
          return instance.basicAuth(request, reply, done);
        }

        return done();
      });
    }
  }
}
