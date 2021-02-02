import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {del, get, getModelSchemaRef, param} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Commission} from '../models/commission.model';
import {Contest} from '../models/contest.model';
import {ACCESS_LEVEL, User} from '../models/user.model';
import {CommissionRepository, ContestRepository, MarkRepository, UserRepository} from '../repositories';
import {SolutionRepository} from '../repositories/solution.repository';
import {OPERATION_SECURITY_SPEC} from '../utils';
export class CommissionController {
  constructor(
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(CommissionRepository)
    protected commissionRepository: CommissionRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
    @repository(SolutionRepository)
    protected solutionRepository: SolutionRepository,
    @repository(MarkRepository)
    protected markRepository: MarkRepository,
  ) {
  }

  @del('/commission/{id}', {
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
  async delTaskById(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number) {
    const uid = currentUser[securityId];
    let userId;

    return this.commissionRepository.findOne({
      where: {
        id: id
      }
    })
      .then((commission) => {
        if (!commission)
          return Promise.reject("No such commission.")

        return Promise.all([
          this.contestRepository.findOne({
            where: {
              id: commission.contestId
            }
          }),
          this.userRepository.findOne({
            where: {
              firebaseUID: uid
            }
          })
        ])
      })
      .then(([contest, user]) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (!contest)
          return Promise.reject("No such contest.")

        userId = user.id;

        if (contest.userId != userId && user.accessLevel < ACCESS_LEVEL.ADMIN)
          return Promise.reject("Insufficient permissions.")

        return this.solutionRepository.find({
          where: {
            userId: userId
          }
        })
      })
      .then((solutions) => {
        const solutionsIds = solutions.map((solution) => solution.id);

        return Promise.all([
          this.markRepository.find({
            where: {
              solutionId: {
                inq: solutionsIds
              }
            }
          }),
          this.commissionRepository.deleteById(id),
          solutions.map((solution) => this.solutionRepository.delete(solution)),
        ])
      })
      .then(([marks, a, b]) => {
        return marks.map((mark) => this.markRepository.delete(mark))
      })
  }


  @get('/commission/all', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Commission, {
              includeRelations: true
            })
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getAll(
    @inject(SecurityBindings.USER) currentUser: UserProfile): Promise<any> {
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

        return this.commissionRepository.find({
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


  @get('/commission/by_contest/add/{contest_id}/{user_id}', {
    security: OPERATION_SECURITY_SPEC,
    description: "Commission has User, instead of userId.",
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

        if (adder.id !== contest.userId)
          return Promise.reject("Not your contest, you can not add anyone to commission.")

        if (contest.endDate < new Date())
          return Promise.reject("Can not edit commission after the end of contest.")

        return this.commissionRepository.create({
          userId,
          contestId
        })
      })
      .then(commission =>
        this.commissionRepository.findById(commission.id, {
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
      )
  }


  @get('/commission/by_contest/{contest_id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Commission, {includeRelations: true}),
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
