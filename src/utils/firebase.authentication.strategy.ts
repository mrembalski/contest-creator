import {AuthenticationStrategy} from '@loopback/authentication';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';


const admin = require('firebase-admin');

export class FirebaseAuthenticationStrategy implements AuthenticationStrategy {
  name = 'firebase';

  constructor() { }

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token = this.extractCredencials(request);

    return admin
      .auth()
      .verifyIdToken(token)
      //https://firebase.google.com/docs/reference/admin/node/admin.auth.DecodedIdToken#uid
      .then((decodedToken: any) => {
        const uid = decodedToken.uid;
        return uid;
      })
      .catch(() => {
        throw new HttpErrors.Unauthorized(`Authorization unsuccessful.`);
      });
  }

  extractCredencials(request: Request): string {

    console.log(request.headers)
    //making sure there is a token
    if (!request.headers.authorization)
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);

    const authenticationHeader = request.headers.authorization;

    //token starts with "Bearer"
    if (!authenticationHeader.startsWith('Bearer'))
      throw new HttpErrors.Unauthorized(
        `Authorization header is not of type 'Bearer'.`,
      );

    const words = authenticationHeader.split(' ');

    //more than two parts
    if (words.length !== 2)
      throw new HttpErrors.Unauthorized(
        `Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.`,
      );

    const token = words[1];

    return token;
  }
}
