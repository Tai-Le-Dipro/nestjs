import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import MongoStore from 'connect-mongo';
import { ConfigService } from '@nestjs/config';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import * as cors from 'cors';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const reflector = app.get(Reflector);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.use(
    cors({
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: configService.get<string>('EXPRESS_SESSION_SECRET'),
      cookie: { maxAge: 3600000000 },
      store: MongoStore?.create({
        mongoUrl: configService.get<string>('MONGODB_URI'),
        collectionName: 'sessions',
      }),
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user); // Adjust this to match your user object structure
  });

  passport.deserializeUser((id, done) => {
    // Fetch user from database using the id
    // Example: User.findById(id, (err, user) => done(err, user));
    done(null, { id }); // Replace with actual user fetching logic
  });

  await app.listen(port ?? 3000);
}
bootstrap();
