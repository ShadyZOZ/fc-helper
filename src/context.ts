import { FCContext, ICredentials, IFunctions, IService } from './interface';

const ORIGIN_EVENT = Symbol.for('ctx#origin_event');
const EVENT = Symbol.for('ctx#event');
const EVENT_PARSED = Symbol.for('ctx#event_parsed');
const PARSED_EVENT = Symbol.for('ctx#parsed_body');
const BODY_PARSED = Symbol.for('ctx#body_parsed');
const BODY = Symbol.for('ctx#body');

export class Request {
  constructor(event: Buffer) {
    this[ORIGIN_EVENT] = event;
    this[PARSED_EVENT] = null;
  }

  get [EVENT]() {
    if (!this[EVENT_PARSED]) {
      this[EVENT_PARSED] = JSON.parse(this[ORIGIN_EVENT].toString());
      this[ORIGIN_EVENT] = null;
    }

    return this[EVENT_PARSED];
  }

  get path() {
    return this[EVENT].path;
  }

  get method() {
    return this[EVENT].httpMethod;
  }

  get headers() {
    return this[EVENT].headers;
  }

  get query() {
    return this[EVENT].queryParameters;
  }

  get params() {
    return this[EVENT].pathParameters;
  }

  get body() {
    if (!this[BODY_PARSED]) {
      if (this[EVENT].isBase64Encoded) {
        this[BODY] = Buffer.from(this[EVENT].body, 'base64').toString();
      } else {
        this[BODY] = this[EVENT].body;
      }
      this[BODY_PARSED] = true;
    }

    return this[BODY];
  }
}

class Response {
  statusCode: number;
  headers: Record<string, string>;
  typeSetted: boolean;
  body: any;

  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.typeSetted = false;
    this.body = null;
  }
}

export class Context {
  req: Request;
  res: Response;
  requestId?: string;
  credentials?: ICredentials;
  function?: IFunctions;
  service?: IService;
  region?: string;
  accountId?: string;

  constructor(event: Buffer, context: FCContext) {
    this.req = new Request(event);
    this.res = new Response();
    this.requestId = context.requestId;
    this.credentials = context.credentials;
    this.function = context.function;
    this.service = context.service;
    this.region = context.region;
    this.accountId = context.accountId;
  }

  // req delegate
  get headers() {
    return this.req.headers;
  }

  get method() {
    return this.req.method;
  }

  get path() {
    return this.req.path;
  }

  get query() {
    return this.req.query;
  }

  get params() {
    return this.req.params;
  }

  get(key: string) {
    return this.headers[key];
  }

  // response delegate
  set type(value) {
    this.res.typeSetted = true;
    this.res.headers['content-type'] = value;
  }

  get type() {
    return this.res.headers['content-type'];
  }

  set body(value) {
    this.res.body = value;
  }

  get body() {
    return this.res.body;
  }

  set status(code) {
    this.res.statusCode = code;
  }

  get status() {
    return this.res.statusCode;
  }

  set(key: string, value: string) {
    this.res.headers[key] = value;
  }
}
