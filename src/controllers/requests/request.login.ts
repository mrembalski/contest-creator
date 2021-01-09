import {
  Entity,
  model,
  property
} from '@loopback/repository';

// https://loopback.io/doc/en/lb4/Model.html
@model()
export class RequestLogin extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  email: string;

  //also password over https header
  //https://security.stackexchange.com/questions/110415/is-it-ok-to-send-plain-text-password-over-https
}
