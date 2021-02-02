import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Mark} from '../models';
import {Solution, SolutionRelations} from '../models/solution.model';
import {Task} from '../models/task.model';
import {User} from '../models/user.model';
import {ContestRepository} from './contest.repository';
import {MarkRepository} from './mark.repository';
import {TaskRepository} from './task.repository';
import {UserRepository} from './user.repository';

export class SolutionRepository extends DefaultCrudRepository<
  Solution,
  typeof Solution.prototype.id,
  SolutionRelations
  > {
  public readonly user: BelongsToAccessor<User, typeof User.prototype.id>;
  public readonly mark: BelongsToAccessor<Mark, typeof Mark.prototype.id>;
  public readonly task: BelongsToAccessor<Task, typeof Task.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserRepository')
    userRepositoryGetter: Getter<UserRepository>,
    @repository.getter('TaskRepository')
    taskRepositoryGetter: Getter<TaskRepository>,
    @repository.getter('MarkRepository')
    markRepositoryGetter: Getter<MarkRepository>,

    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
    @repository(TaskRepository)
    protected taskRepository: TaskRepository,
    @repository(UserRepository)
    protected userRepository: UserRepository
  ) {
    super(Solution, dataSource);

    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);

    this.mark = this.createBelongsToAccessorFor('mark', markRepositoryGetter);

    this.registerInclusionResolver('mark', this.mark.inclusionResolver);

    this.task = this.createBelongsToAccessorFor('task', taskRepositoryGetter);

    this.registerInclusionResolver('task', this.task.inclusionResolver);

  }
  isDateAfterToday(date: Date) {
    return new Date(date.toDateString()) > new Date(new Date().toDateString());
  }

  //#TRIGGER
  definePersistedModel(solutionEntity: typeof Solution) {
    const solutionClass = super.definePersistedModel(solutionEntity);

    solutionClass.observe('before save', async ctx => {
      console.log('SOLUTION - BEFORE SAVE - TRIGGER');

      if (ctx.isNewInstance && ctx.isNewInstance == true) {
        console.log('SOLUTION - BEFORE SAVE - NEW INSTANCE');

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
      }

      console.log('SOLUTION - SAVING - TRIGGER END');
    });

    return solutionClass;
  }
}
