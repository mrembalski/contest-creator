import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Contest} from '../models/contest.model';
import {Participation, ParticipationRelations} from '../models/participation.model';
import {User} from '../models/user.model';
import {ContestRepository} from './contest.repository';
import {UserRepository} from './user.repository';

export class ParticipationRepository extends DefaultCrudRepository<
  Participation,
  typeof Participation.prototype.id,
  ParticipationRelations
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
    super(Participation, dataSource);

    this.contest = this.createBelongsToAccessorFor('contest', contestRepositoryGetter);

    this.registerInclusionResolver('contest', this.contest.inclusionResolver);

    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
