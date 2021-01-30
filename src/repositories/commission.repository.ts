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
    @repository(UserRepository)
    protected userRepository: UserRepository,
    @repository(ContestRepository)
    protected contestRepository: ContestRepository,
  ) {
    super(Commission, dataSource);

    this.contest = this.createBelongsToAccessorFor('contest', contestRepositoryGetter);

    this.registerInclusionResolver('contest', this.contest.inclusionResolver);

    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  //#TRIGGER
  definePersistedModel(commissionEntity: typeof Commission) {
    const commissionClass = super.definePersistedModel(commissionEntity);

    commissionClass.observe('before save', async ctx => {
      console.log('COMMISSION - BEFORE SAVE - TRIGGER');

      const contest = await this.contestRepository.findOne({
        where: {
          id: ctx.instance.contestId
        }
      })

      if (!contest) {
        console.log('COMMISSION - BEFORE SAVE - INVALID DATA');
        throw "No contest with given id."
      }

      const user = await this.userRepository.findOne({
        where: {
          id: ctx.instance.userId
        }
      })

      if (!user) {
        console.log('COMMISSION - BEFORE SAVE - INVALID DATA');
        throw "No user with given id."
      }

      const commission = await this.findOne({
        where: {
          userId: user.id,
          contestId: contest.id
        }
      })

      if (commission) {
        console.log('COMMISSION - BEFORE SAVE - INVALID DATA');
        throw "Given commission already exists."
      }

      console.log('COMMISSION - SAVING - TRIGGER END');
    });

    return commissionClass;
  }

}
