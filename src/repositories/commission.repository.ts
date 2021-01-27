import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Commission, CommissionRelations} from '../models/commission.model';
import {Contest} from '../models/contest.model';
import {User} from '../models/user.model';
import {ContestRepository} from './contest.repository';
import {UserRepository} from './user.repository';

export class CommissionRepository extends DefaultCrudRepository<
  Commission,
  typeof Commission.prototype.id,
  CommissionRelations
  > {

  public readonly contest: BelongsToAccessor<Contest, typeof Contest.prototype.id>;

  public readonly user: BelongsToAccessor<User, typeof User.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('ContestRepository')
    contestRepositoryGetter: Getter<ContestRepository>,
    @repository.getter('UserRepository')
    userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Commission, dataSource);

    this.contest = this.createBelongsToAccessorFor('contest', contestRepositoryGetter);

    this.registerInclusionResolver('contest', this.contest.inclusionResolver);

    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
