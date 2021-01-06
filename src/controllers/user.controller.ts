import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL, User} from '../models';
import {UserRepository} from '../repositories/user.repository';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {RequestRegister} from './requests/request.register';
const admin = require('firebase-admin');

//https://emailregex.com/
const emailRegex = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)

export class UserController {
  constructor(
    @repository(UserRepository)
    protected userRepository: UserRepository,
  ) {
  }

  @get('/user/me', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getMe(
    @inject(SecurityBindings.USER) currentUser: UserProfile) {
    const uid = currentUser[securityId];

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
  }

  @post('/user/register', {
    responses: {
      '200': {
        content: {
          'application/json': {
          },
        },
      },
    },
  })
  async register(
    @requestBody() request: RequestRegister
  ) {
    if (!emailRegex.test(request.email))
      return Promise.reject("Not a valid email.")

    if (request.password.length < 6)
      return Promise.reject("Password too short.")

    if (!this.userRepository.checkEmailAvailable(request.email))
      return Promise.reject("Email already in use.")

    return admin
      .auth()
      .createUser({
        email: request.email,
        emailVerified: false,
        password: request.password,
        displayName: request.displayName,
        disabled: false
      })
      //firebase user instance
      .then((userRecord: any) => {
        // console.log(userRecord);

        return this.userRepository.create({
          email: request.email,
          displayName: request.displayName,
          accessLevel: ACCESS_LEVEL.BASIC,
          firebaseUID: userRecord.uid
        })
      })
      //database user instance
      .then((user: User) => {
        // console.log(user);

        return admin
          .auth()
          //TODO: should not receive token, but for firebase testing i will do that
          //user should be registed on frontend and then token should be passed here
          .createCustomToken(user.firebaseUID)
      })
      .then((customToken: String) => {
        return {
          token: customToken
        };
      })
      .catch((err: Error) => {
        console.error(err);
        return Promise.reject(err.message);
      })
  }

}
