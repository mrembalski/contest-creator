import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {User, UserRelations} from '../models';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
  > {

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(User, dataSource);
  }

  async checkEmailAvailable(email: string): Promise<boolean> {
    return this.find({
      where: {
        email: email
      }
    })
      .then((users) => {
        if (users.length > 0)
          return false;

        return true;
      })
  }
}
