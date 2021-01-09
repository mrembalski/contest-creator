import {inject, Provider} from '@loopback/context';
import {HandlerContext, Reject, Request, RestBindings} from '@loopback/rest';

export class CustomRejectProvider implements Provider<Reject> {
  constructor(@inject(RestBindings.Http.REQUEST) public request: Request) { }

  value() {
    return (response: HandlerContext, result: Error) => {
      this.action(response, result);
    };
  }

  action({request, response}: HandlerContext, result: any) {
    if (result) {
      const headers = (this.request.headers as any) || {};
      const header = headers.accept || 'application/json';
      response.setHeader('Content-Type', header);
      response.status(result.statusCode || 400);
      let formattedResult: any;
      if (result.message) {
        formattedResult = {success: false, errors: {message: result.message}};
      } else {
        formattedResult = {success: false, errors: result};
      }
      response.end(JSON.stringify(formattedResult));
    } else {
      response.end();
    }
  }
}
