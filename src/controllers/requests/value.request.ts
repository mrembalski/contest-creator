import {
  Entity,
  model,
  property
} from '@loopback/repository';

// https://loopback.io/doc/en/lb4/Model.html
@model()
export class ValueRequest extends Entity {
  @property({
    type: 'number',
    required: true,
  })
  value: 0 | 2 | 5 | 6;
}
