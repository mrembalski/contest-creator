import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, patch, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL} from '../models';
import {Mark} from '../models/mark.model';
import {CommissionRepository, ContestRepository, MarkRepository, ParticipationRepository, UserRepository} from '../repositories';
import {SolutionRepository} from '../repositories/solution.repository';
import {TaskRepository} from '../repositories/task.repository';
import {OPERATION_SECURITY_SPEC} from '../utils';
import {MarkRequest} from './requests/value.request';


export class MarkController {
  constructor(
    @repository(ParticipationRepository)
    protected participationRepository: ParticipationRepository,
    @repository(MarkRepository)
    protected markRepository: MarkRepository,
    @repository(TaskRepository)
    protected taskRepository: TaskRepository,
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(SolutionRepository)
    protected solutionRepository: SolutionRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
    @repository(CommissionRepository)
    protected commissionRepository: CommissionRepository,
  ) { }

  @patch('/mark/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Mark),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async patchMarkById(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
    @requestBody() markRequest: MarkRequest) {
    const uid = currentUser[securityId];
    let userId: number;
    let isAdmin: boolean;
    let isAdminOfContest: boolean;

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
      .then((user) => {
        if (!user)
          return Promise.reject("No such user.")

        userId = user.id;
        isAdmin = (user.accessLevel === ACCESS_LEVEL.ADMIN);

        return this.markRepository.findOne({
          where: {
            id: id
          }
        })
      })
      .then((mark) => {
        if (!mark)
          return Promise.reject("No such mark.")

        return this.solutionRepository.findOne({
          where: {
            id: mark.solutionId
          }
        })
      })
      .then((solution) => {
        if (!solution)
          return Promise.reject("No such solution.")

        return this.taskRepository.findOne({
          where: {
            id: solution.taskId
          }
        })
      })
      .then((task) => {
        if (!task)
          return Promise.reject("No such task.")

        return this.contestRepository.findOne({
          where: {
            id: task.contestId
          }
        })
      })
      .then((contest) => {
        if (!contest)
          return Promise.reject("No such contest.")

        isAdminOfContest = (userId === contest.userId);

        return this.commissionRepository.findOne({
          where: {
            userId: userId,
            contestId: contest.id
          }
        })
      })
      .then((commission) => {
        if (!commission && !isAdminOfContest && !isAdmin)
          return Promise.reject("Insufficient permissions.")

        return this.markRepository.updateById(id, markRequest);
      })
  }


  @get('/mark/by_contest/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Mark),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getMarksByContestId(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number) {
    const uid = currentUser[securityId];

    let contestId: number;
    let isAdminOfContest: boolean;

    return Promise.all([
      this.userRepository.findOne({
        where: {
          firebaseUID: uid
        }
      }),
      this.contestRepository.findOne({
        where: {
          id: id
        }
      })
    ])
      .then(([user, contest]) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (!contest)
          return Promise.reject("No such contest.")

        isAdminOfContest = (contest.userId == user.id)
        contestId = contest.id;

        return this.participationRepository.findOne({
          where: {
            userId: user.id,
            contestId: contest.id
          }
        })
      })
      .then((participation) => {
        if (!participation && !isAdminOfContest)
          return Promise.reject("Not your contest.");

        return this.taskRepository.find({
          where: {
            contestId: contestId
          }
        })
      })
      .then((tasks) => {
        const tasksIds = tasks.map((task) => {
          return task.id
        })

        return this.solutionRepository.find({
          where: {
            taskId: {
              inq: tasksIds
            }
          }
        })
      })
      .then((solutions) => {
        const solutionIds = solutions.map((solution) => {
          return solution.id
        })

        return this.markRepository.find({
          where: {
            solutionId: {
              inq: solutionIds
            }
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

  @get('/mark/my/by_contest/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Mark),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getMyMarksByContestId(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number) {
    const uid = currentUser[securityId];

    let userId: number;

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
      .then((user) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        userId = user.id;

        return this.taskRepository.find({
          where: {
            contestId: id
          }
        })
      })
      .then((tasks) => {
        const tasksIds = tasks.map((task) => {
          return task.id
        })

        return this.solutionRepository.find({
          where: {
            userId: userId,
            taskId: {
              inq: tasksIds
            }
          }
        })
      })
      .then((solutions) => {
        const solutionIds = solutions.map((solution) => {
          return solution.id
        })

        return this.markRepository.find({
          where: {
            solutionId: {
              inq: solutionIds
            }
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


  @get('/mark/my', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Mark),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getMyMarks(
    @inject(SecurityBindings.USER) currentUser: UserProfile) {
    const uid = currentUser[securityId];

    let userId: number;

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
      .then((user) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        userId = user.id;
        return this.participationRepository.find({
          where: {
            userId: user.id
          }
        })
      })
      .then((participations) => {
        const contestIds = participations.map((participation) => {
          return participation.contestId
        })

        return this.taskRepository.find({
          where: {
            contestId: {
              inq: contestIds
            }
          }
        })
      })
      .then((tasks) => {
        const tasksIds = tasks.map((task) => {
          return task.id
        })

        return this.solutionRepository.find({
          where: {
            userId: userId,
            taskId: {
              inq: tasksIds
            }
          }
        })
      })
      .then((solutions) => {
        const solutionIds = solutions.map((solution) => {
          return solution.id
        })

        return this.markRepository.find({
          where: {
            solutionId: {
              inq: solutionIds
            }
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


  @post('/mark/by_solution/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Mark),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async markSolution(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
    @requestBody() markRequest: MarkRequest
  ) {
    const uid = currentUser[securityId];

    if (markRequest.value != 0 && markRequest.value != 2 && markRequest.value != 5 && markRequest.value != 6)
      return Promise.reject("Invalid value.")

    let userId: number;

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
      .then((user) => {
        if (!user)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        userId = user.id;
        return this.solutionRepository.findOne({
          where: {
            id: id
          }
        })
      })
      .then((solution) => {
        if (!solution)
          return Promise.reject("No such solution.");

        return this.taskRepository.findOne({
          where: {
            id: solution.taskId
          }
        })
      })
      .then((task) => {
        if (!task)
          return Promise.reject("No such task.");

        return this.contestRepository.findOne({
          where: {
            id: task.contestId
          }
        })
      })
      .then((contest) => {
        if (!contest)
          return Promise.reject("No such contest.");

        return this.commissionRepository.findOne({
          where: {
            userId: userId,
            contestId: contest.id
          }
        })
      })
      .then((commission) => {
        if (!commission)
          return Promise.reject("No such commission.");

        return this.markRepository.create({
          solutionId: id,
          userId: userId,
          value: markRequest.value,
          comment: markRequest.comment
        })
      })
      .then((mark) => {
        return this.solutionRepository.updateById(id, {
          markId: mark.id
        })
      })
  }

}
