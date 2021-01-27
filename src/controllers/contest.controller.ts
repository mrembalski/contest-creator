import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Contest} from '../models/contest.model';
import {ACCESS_LEVEL} from '../models/user.model';
import {ContestRepository, ParticipationRepository, UserRepository} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils';
import {RequestContest} from './requests';
const moment = require('moment')
export class ContestController {
  constructor(
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
    @repository(ParticipationRepository)
    protected participationRepository: ParticipationRepository,
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

    const startDate = new Date(JSON.parse(request.startDate));
    const endDate = new Date(JSON.parse(request.endDate));
    const now = new Date();

    //making sure startDate and endDate are valid dates
    if (!(startDate instanceof Date) || isNaN(startDate.valueOf()))
      return Promise.reject("Not a valid date.");

    if (!(endDate instanceof Date) || isNaN(endDate.valueOf()))
      return Promise.reject("Not a valid date.");

    if (!moment.utc(now).isBefore(moment.utc(startDate)))
      return Promise.reject("Contest needs to start in future.");

    if (!moment.utc(startDate).isBefore(moment.utc(endDate)))
      return Promise.reject("Start date needs to be before end date.");

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

  @get('/contest/{id}', {
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
  async getContestById(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number) {
    const uid = currentUser[securityId];

    let contest_: Contest;

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
      .then((user) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        return Promise.all([
          user,
          this.contestRepository.findOne({
            where: {
              id: id
            }
          }),
          this.participationRepository.findOne({
            where: {
              contestId: id,
              userId: user.id
            }
          })
        ])
      })
      .then(([user, contest, participation]) => {
        if (!contest)
          return Promise.reject("No such contest.");

        if (contest.userId == user.id)
          return contest;

        if (!participation)
          return Promise.reject("Not your contest.");

        return contest;
      })
  }


  @get('/contest/my/as_admin', {
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
  async getMyContestsAsAdmin(
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

        return this.contestRepository.find({
          where: {
            userId: user.id
          }
        })
      })
  }

  @get('/contest/my/as_user', {
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
  async getMyContestsAsUser(
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

        return this.participationRepository.find({
          where: {
            userId: user.id
          }
        })
          .then((participations) => {
            const contestIds = participations.map((participation) => {
              return participation.contestId
            })

            return this.contestRepository.find({
              where: {
                id: {
                  inq: contestIds
                }
              }
            })
          })
      })
  }




}
