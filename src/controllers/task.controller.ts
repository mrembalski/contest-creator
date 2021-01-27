import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, post, requestBody} from '@loopback/rest';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {RequestTask} from '.';
import {ACCESS_LEVEL, Contest, Task, User} from '../models';
import {ContestRepository, ParticipationRepository, UserRepository} from '../repositories';
import {TaskRepository} from '../repositories/task.repository';
import {OPERATION_SECURITY_SPEC} from '../utils';

export class TaskController {
  constructor(
    @repository(TaskRepository)
    protected taskRepository: TaskRepository,
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
    @repository(ParticipationRepository)
    protected participationRepository: ParticipationRepository,
  ) { }

  @get('/task/all', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Task),
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

        return this.taskRepository.find();
      })
  }

  @get('/task/by_contest/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Task),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async getTasksByContestId(
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
  }


  @post('/task/by_contest/add/{contest_id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: getModelSchemaRef(Task),
          },
        },
      },
    },
  })
  @authenticate('firebase')
  async addTaskByContestId(
    @param.path.number('contest_id') contestId: number,
    @requestBody() task: RequestTask,
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
      .then(([adder, contest]: [User | null, Contest | null]) => {
        if (!adder)
          return Promise.reject("No such user with given firebaseUID. Could be deleted.")

        if (!contest)
          return Promise.reject("No such contest with given id. Could be deleted.")

        if (adder.id !== contest.userId)
          return Promise.reject("Not your contest, you can not add tasks to this contest.")

        return this.taskRepository.create({
          contestId: contest.id,
          text: task.text
        })
      })
  }
}
