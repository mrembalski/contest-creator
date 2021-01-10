import {
  Entity,
  model,
  property
} from '@loopback/repository';

@model({
  settings: {
    foreignKeys: {
      fk_participation_userId: {
        name: 'fk_participations_userId',
        entity: 'user',
        entityKey: 'id',
        foreignKey: 'userId',
      },
      fk_participation_contestId: {
        name: 'fk_participations_contestId',
        entity: 'contest',
        entityKey: 'id',
        foreignKey: 'contestId',
      },
    },
  }
})
export class Participation extends Entity {
  @property({
    description: 'participation\'s record id, generated by postgreSQL, can be changed to loopback or postgreSQL uuid generator or custom',
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

  //no neet to be defined, it's already done in contest
  @property({
    postgresql: {
      columnName: 'contest_id'
    }
  })
  contestId: number;

  //no neet to be defined, it's already done in user (participant)
  @property({
    postgresql: {
      columnName: 'user_id'
    }
  })
  userId: number;

  constructor(data?: Partial<Participation>) {
    super(data);
  }
}

export interface ParticipationRelations {
}

export type ParticipationsWithRelations = Participation & ParticipationRelations;
