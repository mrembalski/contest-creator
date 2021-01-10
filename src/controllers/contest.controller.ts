import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL, Contest} from '../models';
import {ContestRepository, UserRepository} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils';
import {RequestContest} from './requests';
const admin = require('firebase-admin');
const moment = require('moment')
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
            schema: getModelSchemaRef(Contest),
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

        return this.contestRepository.find();
      })
  }

  @post('/contest/create', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Contest),
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

    let startDate = new Date(JSON.parse(request.startDate));
    let endDate = new Date(JSON.parse(request.endDate));
    let now = new Date();

    //making sure startDate and endDate are valid dates
    if (!(startDate instanceof Date) || isNaN(startDate.valueOf()))
      return Promise.reject("Not a valid date.");

    if (!(endDate instanceof Date) || isNaN(endDate.valueOf()))
      return Promise.reject("Not a valid date.");

    // console.log(startDate);
    // console.log(endDate);
    // console.log(now)

    // console.log(moment.utc(startDate).toString());
    // console.log(moment.utc(endDate).toString());
    // console.log(moment.utc(now).toString())

    // if (!moment.utc(now).isBefore(moment.utc(startDate)))
    //   return Promise.reject("Contest needs to start in future.");

    // if (!moment.utc(startDate).isBefore(moment.utc(endDate)))
    //   return Promise.reject("Start date needs to be before end date.");

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
          ...request,
          endDate: endDate,
          startDate: startDate,
          userId: user.id
        })
      })
  }

}
