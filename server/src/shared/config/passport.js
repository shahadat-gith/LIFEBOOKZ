import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index.js';
import User from '../../user/model.js';

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-passwordHash');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy(
  {
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl,
    scope: ['profile', 'email'],
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const { id: googleId, emails, displayName, name, photos } = profile;
      const email = emails?.[0]?.value;
      const avatar = photos?.[0]?.value;

      if (!email) return done(new Error('Google account has no email'), null);

      let user = await User.findOne({ googleId });
      if (user) {
        if (avatar) user.avatar = avatar;
        await user.save();
        return done(null, user);
      }

      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
        return done(null, user);
      }

      user = await User.create({
        email,
        name: displayName || name?.givenName || email.split('@')[0],
        avatar,
        googleId,
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

export default passport;
