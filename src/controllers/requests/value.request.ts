import {
  Entity,
  model,
  property
} from '@loopback/repository';

// https://loopback.io/doc/en/lb4/Model.html
@model()
export class MarkRequest extends Entity {
  @property({
    type: 'number',
    required: true,
  })
  value: 0 | 2 | 5 | 6;

  @property({
    type: 'string',
    required: true,
  })
  comment: string;
}
