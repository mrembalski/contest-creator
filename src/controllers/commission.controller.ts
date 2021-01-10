import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL, Commission, Contest, User} from '../models';
import {CommissionRepository, ContestRepository, UserRepository} from '../repositories';
import {OPERATION_SECURITY_SPEC} from '../utils';
const admin = require('firebase-admin');

export class CommissionController {
  constructor(
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(CommissionRepository)
    protected commissionRepository: CommissionRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
  ) {
  }

  @get('/commission/all', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Commission),
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

        return this.commissionRepository.find();
      })
  }


  @get('/commission/by_contest/add/{contest_id}/{user_id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Commission),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async addCommissionByContestId(
    @param.path.number('contest_id') contestId: number,
    @param.path.number('user_id') userId: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile) {
    const uid = currentUser[securityId];

    return Promise.all([
      this.userRepository.findOne({
        where: {
          firebaseUID: uid
        }
      }),
      this.userRepository.findOne({
        where: {
          id: userId
        }
      }),
      this.contestRepository.findOne({
        where: {
          id: contestId
        }
      })
    ])
      .then(([adder, toAdd, contest]: [User | null, User | null, Contest | null]) => {
        if (!adder)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (!toAdd)
          return Promise.reject("No such user with given id. Could be deleted.")

        if (!contest)
          return Promise.reject("No such contest with given id. Could be deleted.")

        if (adder.id != contest.userId)
          return Promise.reject("Not your contest, you can not add anyone to commission.")

        if (contest.endDate > new Date())
          return Promise.reject("Can not edit commission after the end of contest.")

        return this.commissionRepository.create({
          userId,
          contestId
        })
      })
  }


  @get('/commission/by_contest/{contest_id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Commission),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getCommissionsByContestId(
    @param.path.number('contest_id') contestId: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile) {
    const uid = currentUser[securityId];

    return Promise.all([
      this.userRepository.findOne({
        where: {
          firebaseUID: uid
        }
      }),
      this.contestRepository.findOne({
        where: {
          id: contestId
        }
      })
    ])
      .then(([user, contest]: [User | null, Contest | null]) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (!contest)
          return Promise.reject("No such contest with given id. Could be deleted.")

        if (contest.userId !== user.id && user.accessLevel < ACCESS_LEVEL.ADMIN)
          return Promise.reject("Insufficient permissions.");

        return this.commissionRepository.find({
          where: {
            contestId: contestId
          }
        })
      })
  }
}
