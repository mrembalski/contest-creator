import {ReferenceObject, SecuritySchemeObject} from '@loopback/openapi-v3';

export const OPERATION_SECURITY_SPEC = [{firebase: []}];

export type SecuritySchemeObjects = {
  [securityScheme: string]: SecuritySchemeObject | ReferenceObject;
};

export const SECURITY_SCHEME_SPEC: SecuritySchemeObjects = {
  firebase: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
};
