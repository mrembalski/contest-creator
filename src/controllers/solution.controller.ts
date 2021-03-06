import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, patch, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Solution} from '../models/solution.model';
import {ACCESS_LEVEL} from '../models/user.model';
import {CommissionRepository, ContestRepository, UserRepository} from '../repositories';
import {MarkRepository} from '../repositories/mark.repository';
import {SolutionRepository} from '../repositories/solution.repository';
import {TaskRepository} from '../repositories/task.repository';
import {OPERATION_SECURITY_SPEC} from '../utils';
import {getOrder} from '../utils/order.header';
import {RequestSolution} from './requests';

export class SolutionController {
  constructor(
    @repository(SolutionRepository)
    protected solutionRepository: SolutionRepository,
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
    @repository(TaskRepository)
    protected taskRepository: TaskRepository,
    @repository(MarkRepository)
    protected markRepository: MarkRepository,
    @repository(CommissionRepository)
    protected commissionRepository: CommissionRepository,
  ) { }


  @get('/solution/all', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
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
    const orderQuery = getOrder(order);

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

        return this.solutionRepository.find({
          include: [
            {
              relation: 'mark'
            }
          ],
          order: orderQuery
        });
      })
  }

  @get('/solution/by_contest/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getSolutionsToContest(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.string("id") id: number,
    @param.header.string('orderby') order?: string) {
    const uid = currentUser[securityId];
    const orderQuery = getOrder(order);

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
          return Promise.reject("No such contest.");

        return Promise.all([
          user.id != contest.userId && user.accessLevel < ACCESS_LEVEL.ADMIN,
          this.commissionRepository.findOne({
            where: {
              userId: user.id,
              contestId: id
            }
          }),
          this.taskRepository.find({
            where: {
              contestId: id
            }
          })
        ])
      })
      .then(([superuser, commmission, tasks]) => {
        if (!superuser && !commmission)
          return Promise.reject("You are not the admin of this contest.");

        const tasksIds = tasks.map((task) => {
          return task.id
        })

        return this.solutionRepository.find({
          where: {
            taskId: {
              inq: tasksIds
            },
          },
          include: [
            {
              relation: 'mark'
            }
          ],
          order: orderQuery
        })
      })
  }

  @get('/solution/by_contest/{id}/with_mark', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getSolutionsToContestWithMark(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.string("id") id: number,
    @param.header.string('orderby') order?: string) {
    const uid = currentUser[securityId];
    const orderQuery = getOrder(order);

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
          return Promise.reject("No such contest.");

        return Promise.all([
          user.id != contest.userId && user.accessLevel < ACCESS_LEVEL.ADMIN,
          this.commissionRepository.findOne({
            where: {
              contestId: contest.id,
              userId: user.id
            }
          }),
          this.taskRepository.find({
            where: {
              contestId: id
            }
          })
        ])
      })
      .then(([superuser, commission, tasks]) => {
        if (!superuser && !commission)
          return Promise.reject("Insufficient permissions.");

        const tasksIds = tasks.map((task) => {
          return task.id
        })

        return this.solutionRepository.find({
          where: {
            taskId: {
              inq: tasksIds
            },
            markId: {
              neq: null
            }
          },
          include: [
            {
              relation: 'mark'
            }
          ],
          order: orderQuery
        })
      })
  }

  @get('/solution/by_contest/{id}/without_mark', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getSolutionsToContestWithoutMark(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.string("id") id: number,
    @param.header.string('orderby') order?: string) {
    const uid = currentUser[securityId];
    const orderQuery = getOrder(order);

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
          return Promise.reject("No such contest.");

        return Promise.all([
          user.id != contest.userId && user.accessLevel < ACCESS_LEVEL.ADMIN,
          this.commissionRepository.findOne({
            where: {
              contestId: contest.id,
              userId: user.id
            }
          }),
          this.taskRepository.find({
            where: {
              contestId: id
            }
          })
        ])
      })
      .then(([superuser, commission, tasks]) => {
        if (!superuser && !commission)
          return Promise.reject("Insufficient permissions.");

        const tasksIds = tasks.map((task) => {
          return task.id
        })

        return this.solutionRepository.find({
          where: {
            taskId: {
              inq: tasksIds
            },
            markId: {
              eq: null
            }
          },
          include: [
            {
              relation: 'mark'
            }
          ],
          order: orderQuery
        })
      })
  }

  @post('/solution/add/{task_id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async addSolutionByContestId(
    @param.path.number('task_id') taskId: number,
    @requestBody() solution: RequestSolution,
    @inject(SecurityBindings.USER) currentUser: UserProfile) {
    const uid = currentUser[securityId];

    return Promise.all([
      this.userRepository.findOne({
        where: {
          firebaseUID: uid
        }
      }),
      this.taskRepository.findOne({
        where: {
          id: taskId
        },
        include: [
          {
            relation: 'contest'
          }
        ]
      })
    ])
      .then(([adder, task]) => {
        if (!adder)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (!task)
          return Promise.reject("No such task with given id.")

        const now = new Date();

        if (now.getTime() < task.contest.startDate.getTime())
          return Promise.reject("Not before start.")

        if (now.getTime() > task.contest.endDate.getTime())
          return Promise.reject("Not after end.")

        return Promise.all([
          adder,
          this.solutionRepository.findOne({
            where: {
              taskId: taskId,
              userId: adder.id
            }
          })
        ])
      })
      .then(([adder, old_solution]) => {
        if (old_solution)
          return Promise.reject("You have already sent a solution to given task.")

        return this.solutionRepository.create({
          taskId: taskId,
          userId: adder.id,
          markId: undefined,
          text: solution.text
        })
      })
  }

  @post('/solution/{task_id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async postSolutionByTaskId(
    @param.path.number('task_id') taskId: number,
    @requestBody() solution: RequestSolution,
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

        return this.solutionRepository.findOne({
          where: {
            userId: user.id,
            taskId: taskId
          }
        })
      })
  }

  @get('/solution/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getSolutionById(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number) {
    const uid = currentUser[securityId];

    let userId: number;
    let isAdmin: boolean;

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
      .then((user) => {
        if (!user)
          return Promise.reject("No such user.")

        userId = user.id;
        isAdmin = ACCESS_LEVEL.ADMIN === user.accessLevel;

        return this.solutionRepository.findById(id)
      })
      .then((solution) => this.taskRepository.findById(solution.taskId))
      .then((task) => this.contestRepository.findById(task.contestId))
      .then((contest) => Promise.all([
        contest,
        this.commissionRepository.find({
          where: {
            contestId: contest.id
          }
        })
      ]))
      .then(([contest, commissions]) => {
        const userIds = commissions.map(commission => commission.userId)

        if (!isAdmin && contest.userId != userId && !userIds.includes(userId))
          return Promise.reject("Unauthorized.");

        return this.solutionRepository.findById(id, {
          include: [
            {
              relation: 'mark'
            }
          ]
        });
      })
  }


  @get('/solution/my/by_task/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getMySolutionByTaskId(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number) {
    const uid = currentUser[securityId];

    return this.userRepository.findOne({
      where: {
        firebaseUID: uid
      }
    })
      .then((user) => {
        if (!user)
          return Promise.reject("No such user.")

        return this.solutionRepository.findOne({
          where: {
            userId: user.id,
            taskId: id
          },
          include: [
            {
              relation: 'mark'
            }
          ]
        })
      })
  }

  @patch('/solution/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Solution),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async patchSolutionById(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.path.number('id') id: number,
    @requestBody() newSolution: RequestSolution) {
    const uid = currentUser[securityId];

    return Promise.all([
      this.userRepository.findOne({
        where: {
          firebaseUID: uid
        }
      }),
      this.solutionRepository.findOne({
        where: {
          id: id
        }
      })
    ])
      .then(([user, solution]) => {
        if (!user)
          return Promise.reject("No such user.")

        if (!solution)
          return Promise.reject("No such solution.")

        if (solution.userId != user.id)
          return Promise.reject("Not your solution.")

        solution.text = newSolution.text;

        return Promise.all([
          this.taskRepository.findById(solution.taskId),
          solution
        ])
      })
      .then(([task, solution]) => {
        return Promise.all([
          this.contestRepository.findById(task.contestId),
          solution
        ])
      })
      .then(([contest, solution]) => {

        const now = new Date();

        if (now.getTime() < contest.startDate.getTime())
          return Promise.reject("Not before start.")

        if (now.getTime() > contest.endDate.getTime())
          return Promise.reject("Not after end.")

        return this.solutionRepository.save(solution)
      })
  }

}
