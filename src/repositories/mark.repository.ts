import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Mark, MarkRelations} from '../models';

export class MarkRepository extends DefaultCrudRepository<
  Mark,
  typeof Mark.prototype.id,
  MarkRelations
  > {

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Mark, dataSource);
  }
}
