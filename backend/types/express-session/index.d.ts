import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      info: {
        id: string;
        username: string;
        avatar?: string;
        discriminator: string;
      },
      accessToken: string
    };
  }
}
