import {
  Entity,
  model,
  property
} from '@loopback/repository';

// https://loopback.io/doc/en/lb4/Model.html
// https://loopback.io/doc/en/lb4/Model.html#data-mapping-properties


@model({
  settings: {
    foreignKeys: {
      fk_contest_userId: {
        name: 'fk_contest_userId',
        entity: 'user',
        entityKey: 'id',
        foreignKey: 'userId',
      },
    },
  }
})
export class Contest extends Entity {
  @property({
    description: 'contest\'s id, generated by postgreSQL, can be changed to loopback or postgreSQL uuid generator or custom',
    type: 'number',
    id: true,
    generated: true,
    postgresql: {
      columnName: 'id',
      dataType: 'integer',
      dataLength: null,
      dataPrecision: null,
      dataScale: 0,
      nullable: 'NO',
      unique: true,
    },
  })
  id: number;

  @property({
    description: 'contest\'s title, can be changed',
    type: 'string',
    id: false,
    required: true,
    postgresql: {
      columnName: 'title',
      dataType: 'text',
      dataLength: null,
      dataPrecision: null,
      dataScale: null,
      nullable: 'NO',

    },
  })
  title: string;

  @property({
    type: 'date',
    description: 'Timestamp with timezone when was contest created',
    defaultFn: 'now',
    postgresql: {
      columnName: 'created_at',
      dataType: 'timestamp with time zone',
    },
  })
  createdAt: Date;

  @property({
    type: 'date',
    description: 'Timestamp with timezone when was contest created',
    required: true,
    postgresql: {
      columnName: 'starting_at',
      dataType: 'timestamp with time zone',
    },
  })
  startDate: Date;

  @property({
    type: 'date',
    description: 'Timestamp with timezone when was contest created',
    required: true,
    defaultFn: 'now',
    postgresql: {
      columnName: 'ending_at',
      dataType: 'timestamp with time zone',
    },
  })
  endDate: Date;

  @property({
    postgresql: {
      columnName: 'user_id'
    }
  })
  userId: number;

  constructor(data?: Partial<Contest>) {
    super(data);
  }
}

export interface ContestRelations {
}

export type ContestWithRelations = Contest & ContestRelations;
