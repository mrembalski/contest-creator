import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL, User} from '../models/user.model';
import {UserRepository} from '../repositories/user.repository';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
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
    responses: {
      '200': {
        description: 'Login user',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async login(
    @param.header.string('Authorization') idToken: string) {
    let uid: string;

    let registration: boolean = false;

    if (!idToken)
      return Promise.reject("No header.");

    //token starts with "Bearer"
    if (!idToken.startsWith('Bearer'))
      return Promise.reject("Invalid header.");

    const words = idToken.split(' ');

    //more than two parts
    if (words.length !== 2)
      return Promise.reject("Authorization header value has too many parts. It must follow the pattern: 'Bearer xx.yy.zz' where xx.yy.zz is a valid JWT token.");

    const token = words[1];

    return admin
      .auth()
      .verifyIdToken(token)
      .then((decodedToken: any) => {
        uid = decodedToken.uid;

        return Promise.all([
          this.userRepository.findOne({
            where: {
              firebaseUID: uid
            }
          }),
          admin.auth().getUser(uid)
        ])
      })
      .then(([user, firebaseUser]: [User, any]) => {
        if (!user) {
          registration = true;

          return this.userRepository.create({
            firebaseUID: uid,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            email: firebaseUser.email,
            accessLevel: ACCESS_LEVEL.BASIC
          })
        }

        // if (user.disabled)
        //   return Promise.reject('Your account has been blocked.');

        user.photoURL = firebaseUser.photoURL;
        return this.userRepository.save(user);
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
}
