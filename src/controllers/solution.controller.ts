import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {ACCESS_LEVEL, Solution, Task, User} from '../models';
import {ContestRepository, UserRepository} from '../repositories';
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
