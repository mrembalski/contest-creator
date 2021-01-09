import {inject, Provider} from '@loopback/context';
import {
  OperationRetval, Request,
  Response,
  RestBindings, Send
} from '@loopback/rest';

export class CustomSendProvider implements Provider<Send> {
  constructor(@inject(RestBindings.Http.REQUEST) public request: Request) { }

  value() {
    return (response: Response, result: OperationRetval) => {
      this.action(response, result);
    };
  }

  action(response: Response, result: OperationRetval) {
    if (result) {
      const headers = (this.request.headers as any) || {};
      const header = headers.accept || 'application/json';
      response.setHeader('Content-Type', header);
      if (!result.openapi) {
        const formattedResult = {success: true, data: result};
        response.end(JSON.stringify(formattedResult));
      } else {
        response.end(JSON.stringify(result));
      }
    } else {
      response.end();
    }
  }
}
