import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {UserRepository} from '../repositories/user.repository';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {RequestRegister} from './requests/request.register';
const admin = require('firebase-admin');


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
    return currentUser[securityId];
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

    console.log(request);

  }

}
