import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import MongoStore from 'connect-mongo';
import { ConfigService } from '@nestjs/config';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const reflector = app.get(Reflector);

  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: configService.get<string>('EXPRESS_SESSION_SECRET'),
      cookie: { maxAge: 3600000 },
      store: MongoStore?.create({
        mongoUrl: configService.get<string>('MONGODB_URI'),
        collectionName: 'sessions',
      }),
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
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
