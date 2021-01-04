import {
  inject,
  lifeCycleObserver,
  LifeCycleObserver,
  ValueOrPromise
} from '@loopback/core';
import {juggler} from '@loopback/repository';
import devConfig from './db.datasource.dev.json';
const admin = require('firebase-admin');

export class DataSourceSettings {
  name: string;
  connector: string;
  url?: string;
  file?: string;
}

let config: DataSourceSettings;

console.log(' --- Database in Dev Mode --- ');
config = devConfig;
console.log(config);


@lifeCycleObserver('datasource')
export class DbDataSource
  extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'db';

  constructor(
    @inject('datasources.config.db', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }

  /**
   * Start the datasource when application is started
   */
  start(): ValueOrPromise<void> {
    // Add your logic here to be invoked when the application is started
  }

  /**
   * Disconnect the datasource when application is stopped. This allows the
   * application to be shut down gracefully.
   */
  stop(): ValueOrPromise<void> {
    admin.apps.forEach((app: {delete: () => Promise<any>}) => {
      app.delete().then(
        () => { },
        () => { },
      );
    });
    return super.disconnect();
  }
}
