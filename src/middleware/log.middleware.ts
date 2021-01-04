import {Middleware} from "@loopback/rest";

const Log: Middleware = async (ctx, next) => {
  const {request, response} = ctx;

  console.log(response.statusCode, request.method, request.originalUrl);

}

export default Log
