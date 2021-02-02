import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, put} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL, User} from '../models/user.model';
import {UserRepository} from '../repositories/user.repository';
import {getOrder} from '../utils/order.header';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
const admin = require('firebase-admin');

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

    console.log(words);
    console.log(token);

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
          return this.userRepository.create({
            firebaseUID: uid,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            email: firebaseUser.email,
            accessLevel: ACCESS_LEVEL.BASIC,
            disabled: false
          })
        }

        if (user.disabled)
          return Promise.reject('Your account has been blocked.');

        if (user.photoURL != firebaseUser.photoURL) {
          user.photoURL = firebaseUser.photoURL;
          return this.userRepository.save(user);
        }

        return user;
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
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.header.string('orderby') order?: string) {
    const uid = currentUser[securityId];
    const orderQuery = getOrder(order)

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

        return this.userRepository.find({
          order: orderQuery
        });
      })
  }


  @get('/user/all/{access_level}', {
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
  async getAllByAccess(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('access_level') accessLevel: number,
    @param.header.string('orderby') order?: string) {
    const uid = currentUser[securityId];
    const orderQuery = getOrder(order)

    if (accessLevel != 1 && accessLevel != 2 && accessLevel != 3)
      return Promise.reject("No such access level");

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

        return this.userRepository.find({
          where: {
            accessLevel
          },
          order: orderQuery
        });
      })
  }

  @put('/user/disable_or_enable/{user_id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            // schema: getModelSchemaRef(),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async disableOrEnableUser(
    @inject(SecurityBindings.USER)
    currentUser: UserProfile,
    @param.query.string('block') block: boolean,
    @param.path.number('user_id') id: number,
  ) {
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

        return this.userRepository.updateById(id, {
          disabled: block
        });
      })
  }


}
