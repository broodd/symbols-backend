import basicAuth from '@fastify/basic-auth';

import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { ConfigService } from './config';

const TOKENS_DESCRIPTION = `
##### 🔐 Default Authorization Credentials

- **admin@gmail.com** *Password1*

- **client@gmail.com** *Password1*
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
