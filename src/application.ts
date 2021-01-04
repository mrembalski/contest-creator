import {
  AuthenticationComponent,
  registerAuthenticationStrategy
} from '@loopback/authentication';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import Log from './middleware/log.middleware';
import {BaseSequence} from './sequence';
import {FirebaseAuthenticationStrategy} from './utils/firebase.authentication.strategy';
import {SECURITY_SCHEME_SPEC} from './utils/security-spec';

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}
const pkg: PackageInfo = require('../package.json');

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const oracledb = require('oracledb');


export class ContestCreatorApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.api({
      openapi: '3.0.0',
      info: {title: pkg.name, version: pkg.version},
      paths: {},
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      servers: [{url: '/'}],
    });

    this.setUpBindings();
    registerAuthenticationStrategy(this, FirebaseAuthenticationStrategy);
    this.sequence(BaseSequence);
    this.static('/', path.join(__dirname, '../public'));
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);
    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    this.middleware(Log);

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://silver-e62b5.firebaseio.com',
      });
    }
  }

  setUpBindings(): void {
    // this.bind(RestBindings.SequenceActions.SEND).toProvider(CustomSendProvider);
    // this.bind(RestBindings.SequenceActions.REJECT).toProvider(
    //   CustomRejectProvider,
    // );

    this.component(AuthenticationComponent);
  }
}
