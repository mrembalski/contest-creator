import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Contest} from '../models/contest.model';
import {Task, TaskRelations} from '../models/task.model';
import {ContestRepository} from './contest.repository';

export class TaskRepository extends DefaultCrudRepository<
  Task,
  typeof Task.prototype.id,
  TaskRelations
  > {
  public readonly contest: BelongsToAccessor<Contest, typeof Contest.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('ContestRepository')
    contestRepositoryGetter: Getter<ContestRepository>,
  ) {
    super(Task, dataSource);

    this.contest = this.createBelongsToAccessorFor('contest', contestRepositoryGetter);

    this.registerInclusionResolver('contest', this.contest.inclusionResolver);
  }
}
