import {
  Entity,
  model,
  property
} from '@loopback/repository';

@model()
export class RequestSolution extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  text: string;
}
