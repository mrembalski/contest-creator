import {
  Entity,
  model,
  property
} from '@loopback/repository';

export enum ACCESS_LEVEL {
  BASIC = 1,
  CONTEST_CREATOR = 2,
  ADMIN = 3
}

// https://loopback.io/doc/en/lb4/Model.html
@model()
export class User extends Entity {
  @property({
    description: 'user\'s id, generated by postgreSQL, can be changed to loopback or postgreSQL uuid generator or custom',
    type: 'number',
    id: true,
    generated: true,
    unique: true,
    postgresql: {
      columnName: 'id',
      dataType: 'integer',
      dataLength: null,
      dataPrecision: null,
      dataScale: 0,
      nullable: 'NO',
      unique: true
    }
  })
  id: number;

  @property({
    description: 'user\'s firebase uid, generated by google firebase',
    type: 'string',
    id: true,
    required: true,
    postgresql: {
      columnName: 'firebase_uid',
      datatype: 'character varying',
      dataLength: 100,
      nullable: 'NO',
    },
  })
  firebaseUID: string;

  @property({
    description: 'user\'s display name, can be changed',
    type: 'string',
    id: false,
    required: true,
    postgresql: {
      columnName: 'display_name',
      datatype: 'character varying',
      dataLength: 100,
      nullable: 'NO',
    },
  })
  displayName: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {
      columnName: 'user_email',
      datatype: 'character varying',
      dataLength: 100,
      nullable: 'NO',
      unique: 'YES'
    },
  })
  email: string;

  @property({
    type: 'string',
    postgresql: {
      columnName: 'email',
      datatype: 'character varying',
      dataLength: 100,
      nullable: 'NO',
    },
  })
  photoURL: string;

  @property({
    type: 'boolean',
    description: 'Is user disabled info',
    default: false,
    postgresql: {
      columnName: 'user_disabled',
      datatype: 'boolean',
    },
  })
  disabled: boolean;

  @property({
    type: 'number',
    required: true,
    generated: true,
    postgresql: {
      columnName: 'access_level',
      dataType: 'integer',
      dataLength: null,
      dataPrecision: null,
      dataScale: 0,
      nullable: 'NO',
      unique: true,
    },
  })
  accessLevel: ACCESS_LEVEL;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
}

export type UserWithRelations = User & UserRelations;
