import {
  globalInterceptor,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise
} from '@loopback/context';
import {RestBindings} from '@loopback/rest';

const colors = require('colors');
const getColorTheme = (method: string): string => {
  switch (method) {
    case 'GET':
      return 'blue';
    case 'POST':
      return 'green';
    case 'PUT':
      return 'magenta';
    case 'DELETE':
      return 'red';
    default:
      return 'white';
  }
};

@globalInterceptor('', {tags: {name: 'logging'}})
export class LoggingInterceptor implements Provider<Interceptor> {

  value() {
    return this.intercept.bind(this);
  }

  async intercept(invocationCtx: InvocationContext, next: () => ValueOrPromise<InvocationResult>) {
    try {

      const req = await invocationCtx.get(RestBindings.Http.REQUEST, {
        optional: true,
      });

      const result = await next();

      if (req)
        console.log(
          colors[getColorTheme(req.method)](req.method),
          colors.yellow(req.url),
          '\n\tquery: ' + JSON.stringify(req.query)?.substring(0, 1000),
          '\n\tbody: ' + JSON.stringify(req.body)?.substring(0, 1000),
          '\n\tresponse: ' + JSON.stringify(result)?.substring(0, 1000),
        )

      return result;
    }
    catch (err) {

      console.log(err);
      throw err;
    }
  }
}
