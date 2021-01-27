import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Contest, ContestRelations} from '../models/contest.model';
import {User} from '../models/user.model';
import {UserRepository} from './user.repository';

export class ContestRepository extends DefaultCrudRepository<
  Contest,
  typeof Contest.prototype.id,
  ContestRelations
  > {

  public readonly user: BelongsToAccessor<User, typeof User.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('UserRepository')
    userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Contest, dataSource);

    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
