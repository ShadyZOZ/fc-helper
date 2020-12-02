import { Context } from './context';
import { FCContext } from './interface';

type FCCallbackFn = (err: Error | null, response?: any) => void;
type FCAsyncFnHandler = (event: Buffer, context: FCContext) => Promise<any>;
type FCRequestHandler = (context: Context) => Promise<void>;

// export type FCEventHandler = (event: Buffer, context: FCContext, callback: FCCallbackFn) => void;
export interface FCEventHandler {
  (event: Buffer, context: FCContext, callback: FCCallbackFn): void;
}

/**
 * @deprecated 代码有点奇怪
 * @param handler 类web controller式写法
 */
export function hook(handler: FCRequestHandler) {
  return function (event: Buffer, context: FCContext, callback: FCCallbackFn) {
    if (handler.constructor.name !== 'AsyncFunction') {
      const err = new TypeError('Must be an AsyncFunction');
      return callback(err);
    }

    const ctx = new Context(event, context);

    handler(ctx).then(() => {
      const data = ctx.body;
      let encoded = false;
      if (typeof data === 'string') {
        if (!ctx.type) {
          ctx.type = 'text/plain';
        }
        ctx.body = data;
      } else if (Buffer.isBuffer(data)) {
        encoded = true;
        if (!ctx.type) {
          ctx.type = 'application/octet-stream';
        }
        ctx.body = data.toString('base64');
      } else if (typeof data === 'object') {
        if (!ctx.type) {
          ctx.type = 'application/json';
        }
        ctx.body = JSON.stringify(data);
      }

      return {
        isBase64Encoded: encoded,
        statusCode: ctx.status,
        headers: ctx.res.headers,
        body: ctx.body,
      };
    }).then((response) => {
      callback(null, response);
    }, (err) => {
      callback(err);
    });
  };
}

export class Tester {
  protected handler: FCEventHandler;

  constructor(handler: FCEventHandler) {
    this.handler = handler;
  }

  run(event: Buffer, context: FCContext = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.handler(event, context, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }
}

export function test(handler: FCEventHandler) {
  return new Tester(handler);
}

export function asyncWrap(asyncCall: FCAsyncFnHandler) {
  return function (event: Buffer, context: FCContext, callback: FCCallbackFn) {
    if (asyncCall.constructor.name !== 'AsyncFunction') {
      const err = new TypeError('Must be an AsyncFunction');
      return callback(err);
    }

    asyncCall(event, context).then((result) => {
      callback(null, result);
    }, (err) => {
      callback(err);
    });
  };
}

export { FCContext };
