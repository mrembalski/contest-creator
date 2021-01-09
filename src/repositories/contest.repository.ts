import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Contest, ContestRelations} from '../models';

export class ContestRepository extends DefaultCrudRepository<
  Contest,
  typeof Contest.prototype.id,
  ContestRelations
  > {

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Contest, dataSource);
  }
}
