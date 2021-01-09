import {
  Entity,
  model,
  property
} from '@loopback/repository';

// https://loopback.io/doc/en/lb4/Model.html
@model()
export class RequestContest extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
    required: true,
  })
  startDate: Date;

  @property({
    type: 'string',
    required: true,
  })
  endDate: Date;
}
