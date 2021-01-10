import {inject} from '@loopback/core';
import {DefaultCrudRepository, repository} from '@loopback/repository';
import {ContestRepository, UserRepository} from '.';
import {DbDataSource} from '../datasources';
import {Solution, SolutionRelations} from '../models';
import {TaskRepository} from './task.repository';

export class SolutionRepository extends DefaultCrudRepository<
  Solution,
  typeof Solution.prototype.id,
  SolutionRelations
  > {

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
    @repository(TaskRepository)
    protected taskRepository: TaskRepository,
    @repository(UserRepository)
    protected userRepository: UserRepository
  ) {
    super(Solution, dataSource);
  }

  isDateAfterToday(date: Date) {
    return new Date(date.toDateString()) > new Date(new Date().toDateString());
  }

  //#TRIGGER
  definePersistedModel(solutionEntity: typeof Solution) {
    const solutionClass = super.definePersistedModel(solutionEntity);

    solutionClass.observe('before save', async ctx => {
      console.log('SOLUTION - BEFORE SAVE - TRIGGER');

      const task = await this.taskRepository.findOne({
        where: {
          id: ctx.instance.taskId
        }
      })

      if (!task) {
        console.log('SOLUTION - BEFORE SAVE - INVALID DATA');
        throw "No task with given id."
      }

      const contest = await this.contestRepository.findOne({
        where: {
          id: task.contestId
        }
      })

      if (!contest) {
        console.log('SOLUTION - BEFORE SAVE - INVALID DATA');
        throw "No contest with given id."
      }

      const now = new Date();

      if (now.getTime() < contest.startDate.getTime()) {
        console.log('SOLUTION - BEFORE SAVE - INVALID DATA');
        throw "Contest not started yet."
      }

      console.log('SOLUTION - SAVING - TRIGGER END');
    });

    return solutionClass;
  }

}
