import {
  Entity,
  model,
  property
} from '@loopback/repository';

@model()
export class ResponseLogin extends Entity {
  @property({
    type: 'string',
  })
  token: string;
}
