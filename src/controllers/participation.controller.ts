import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Contest} from '../models/contest.model';
import {Participation} from '../models/participation.model';
import {ACCESS_LEVEL, User} from '../models/user.model';
import {ContestRepository, UserRepository} from '../repositories';
import {ParticipationRepository} from '../repositories/participation.repository';
import {OPERATION_SECURITY_SPEC} from '../utils';

export class ParticipationController {
  constructor(
    @repository(ParticipationRepository)
    protected participationRepository: ParticipationRepository,
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,

  ) { }


  @get('/participation/all', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Participation, {includeRelations: true}),
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

        return this.participationRepository.find({
          include: [
            {
              relation: 'user',
              scope: {
                fields: {
                  displayName: true,
                  id: true
                }
              }
            }
          ]
        })
      })
  }

  @get('/participation/by_contest/add/{contest_secret}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Participation),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async addParticipationByContestId(
    @param.path.string('contest_secret') contestSecret: string,
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
          secret: contestSecret
        }
      })
    ])
      .then(([user, contest]: [User | null, Contest | null]) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (!contest)
          return Promise.reject("No such contest with given id. Could be deleted.")

        return this.participationRepository.create({
          contestId: contest.id,
          userId: user.id
        })
      })
  }

  @get('/participation/by_contest/{contest_id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Participation, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getParticipationByContestId(
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

        return this.participationRepository.find({
          where: {
            contestId: contestId
          },
          include: [
            {
              relation: 'user',
              scope: {
                fields: {
                  displayName: true,
                  id: true
                }
              }
            }
          ]
        })
      })
  }

}
