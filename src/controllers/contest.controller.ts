import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL} from '../models';
import {ContestRepository} from '../repositories/contest.repository';
import {UserRepository} from '../repositories/user.repository';
import {OPERATION_SECURITY_SPEC} from '../utils/security-spec';
import {RequestContest} from './requests/request.contest';
const admin = require('firebase-admin');

export class ContestController {
  constructor(
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
  ) {
  }

  @get('/contest/all', {
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

  @post('/contest/create', {
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
  async register(
    @requestBody() request: RequestContest,
    @inject(SecurityBindings.USER) currentUser: UserProfile
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

        if (user.accessLevel < ACCESS_LEVEL.CONTEST_CREATOR)
          return Promise.reject("Insufficient permissions.");

        return this.contestRepository.create({
          ...request
        })
      })
  }

}
