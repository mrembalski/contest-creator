import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {FilterBuilder, repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, patch, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {Solution} from '../models/solution.model';
import {ACCESS_LEVEL} from '../models/user.model';
import {ContestRepository, UserRepository} from '../repositories';
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
    @param.header.string('orderby') order?: string,
    @param.header.boolean('filterby') filter?: boolean) {
    const uid = currentUser[securityId];
    const orderQuery = getOrder(order);

    let filterQuery: any;

    if (filter !== undefined) {
      if (filter == true)
        filterQuery = new FilterBuilder().where({
          markId: undefined
        })
      else
        filterQuery = new FilterBuilder()
    }
    else
      filterQuery = new FilterBuilder()

    console.log(filterQuery)

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

        if (user.id != contest.userId && user.accessLevel < ACCESS_LEVEL.ADMIN)
          return Promise.reject("You are not the admin of this contest.");

        return this.taskRepository.find({
          where: {
            contestId: id
          }
        })
      })
      .then((tasks) => {
        const tasksIds = tasks.map(task => task.id)

        filterQuery.impose({
          taskId: {
            inq: tasksIds
          },
          include: [
            {
              relation: 'mark'
            }
          ],
          order: orderQuery
        })

        return this.solutionRepository.find(
          filterQuery.build()
        )
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

        return this.solutionRepository.save(solution);
      })
  }

}
