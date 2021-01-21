import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL, Solution, SolutionRelations, Task, User} from '../models';
import {ContestRepository, UserRepository} from '../repositories';
import {MarkRepository} from '../repositories/mark.repository';
import {SolutionRepository} from '../repositories/solution.repository';
import {TaskRepository} from '../repositories/task.repository';
import {OPERATION_SECURITY_SPEC} from '../utils';
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

        return this.solutionRepository.find();
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
    @param.path.string("id") id: number
  ) {
    const uid = currentUser[securityId];
    let solutions_: (Solution & SolutionRelations)[];

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

        // if (user.id != contest.userId)
        //   return Promise.reject("You are not the admin of this contest.");

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
            taskId: {
              inq: tasksIds
            },
          },
        })
      })
      .then((solutions) => {

        solutions_ = solutions;
        const promises =
          solutions.map((solution) => {
            return this.markRepository.findOne({
              where: {
                solutionId: solution.id
              }
            })
          })

        return Promise.all(promises);
      })
      .then((marks) => {
        return solutions_.map((solution) => {
          let myMark = marks.find((element) => {
            element && element.solutionId == solution.id
          })

          return {
            ...solution,
            mark: myMark
          }
        })
      })
  }


  @get('/solution/add/{task_id}', {
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
        }
      })
    ])
      .then(([adder, task]: [User | null, Task | null]) => {
        if (!adder)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (!task)
          return Promise.reject("No such task with given id.")

        return this.solutionRepository.create({
          taskId: taskId,
          userId: adder.id,
          text: solution.text
        })
      })
  }
}
