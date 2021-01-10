import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL, User} from '../models';
import {UserRepository} from '../repositories/user.repository';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {RequestLogin} from './requests/request.login';
import {RequestRegister} from './requests/request.register';
import {ResponseLogin} from './responses';
const admin = require('firebase-admin');

//https://emailregex.com/
const emailRegex = new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)
const firebase = require("firebase");

//LOGIN
//https://stackoverflow.com/questions/44899658/how-to-authenticate-an-user-in-firebase-admin-in-nodejs
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
            schema: getModelSchemaRef(User)
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
      },
    })
  }

  @post('/user/login', {
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(ResponseLogin),
          },
        },
      },
    },
  })
  async login(
    @requestBody() request: RequestLogin,
    @param.header.string("password") password: String
  ) {
    if (!emailRegex.test(request.email))
      return Promise.reject("Not a valid email.");

    if (!this.userRepository.checkEmailAvailable(request.email))
      return Promise.reject("Email already in use.");

    return firebase.auth().signInWithEmailAndPassword(request.email, password)
      .then((user: any) => {
        return admin.auth().createCustomToken(user.user.uid)
      })
      .then((token: String) => {
        return {
          token: token
        }
      })
      .catch((err: Error) => {
        console.error(err);
        return Promise.reject(err.message);
      })
  }

  @get('/user/all', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getAll(
    @inject(SecurityBindings.USER) currentUser: UserProfile) {
    const uid = currentUser[securityId];

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
      .then((user) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (user.accessLevel < ACCESS_LEVEL.ADMIN)
          return Promise.reject("Insufficient permissions.");

        return this.userRepository.find();
      })
  }


  @post('/user/register', {
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(ResponseLogin),
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
        return this.userRepository.create({
          email: request.email,
          displayName: request.displayName,
          accessLevel: ACCESS_LEVEL.BASIC,
          firebaseUID: userRecord.uid
        })
      })
      //database user instance
      .then((user: User) => {
        return admin
          .auth()
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
