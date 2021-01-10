import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Commission, CommissionRelations} from '../models';

export class CommissionRepository extends DefaultCrudRepository<
  Commission,
  typeof Commission.prototype.id,
  CommissionRelations
  > {

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Commission, dataSource);
  }
}
