import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Mark, MarkRelations} from '../models/mark.model';
import {Solution} from '../models/solution.model';
import {User} from '../models/user.model';
import {SolutionRepository} from './solution.repository';
import {UserRepository} from './user.repository';

export class MarkRepository extends DefaultCrudRepository<
  Mark,
  typeof Mark.prototype.id,
  MarkRelations
  > {

  public readonly solution: BelongsToAccessor<Solution, typeof Solution.prototype.id>;

  public readonly user: BelongsToAccessor<User, typeof User.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserRepository')
    userRepositoryGetter: Getter<UserRepository>,
    @repository.getter('SolutionRepository')
    solutionRepository: Getter<SolutionRepository>,
  ) {
    super(Mark, dataSource);

    this.solution = this.createBelongsToAccessorFor('solution', solutionRepository);

    this.registerInclusionResolver('solution', this.solution.inclusionResolver);

    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
