import {
  Entity,
  model,
  property
} from '@loopback/repository';

// https://loopback.io/doc/en/lb4/Model.html
@model()
export class RequestRegister extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  displayName: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;
}
