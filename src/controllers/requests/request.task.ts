import {
  Entity,
  model,
  property
} from '@loopback/repository';

@model()
export class RequestTask extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  text: string;

  @property({
    type: 'string',
    required: true,
  })
  title: string;
}
