import assert from 'assert';
import { hook, asyncWrap, test } from '../src';

describe('index.js', () => {
  it('should ok with plain text', async () => {
    const handle = hook(async (ctx) => {
      ctx.body = 'hello world!';
    });
    const res = await test(handle).run(Buffer.from(''));
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'text/plain');
    assert.strictEqual(res.body, 'hello world!');
  });

  it('should ok with json', async () => {
    const handle = hook(async (ctx) => {
      ctx.body = { ok: true };
    });
    const res = await test(handle).run(Buffer.from(''));
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.strictEqual(res.body, '{"ok":true}');
  });

  it('should ok with raw json', async () => {
    const handle = hook(async (ctx) => {
      ctx.type = 'application/json';
      ctx.body = '{"ok":true}';
    });
    const res = await test(handle).run(Buffer.from(''));
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.strictEqual(res.body, '{"ok":true}');
  });

  it('should ok with raw json/object', async () => {
    const handle = hook(async (ctx) => {
      ctx.type = 'application/json';
      ctx.body = { ok: true };
    });
    const res = await test(handle).run(Buffer.from(''));
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/json');
    assert.strictEqual(res.body, '{"ok":true}');
  });

  it('should ok with Buffer', async () => {
    const handle = hook(async (ctx) => {
      ctx.body = Buffer.from('hello world!');
    });
    const res = await test(handle).run(Buffer.from(''));
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/octet-stream');
    assert.strictEqual(res.body, Buffer.from('hello world!').toString('base64'));
  });

  it('should ok with context', async () => {
    const handle = hook(async (ctx) => {
      ctx.body = ctx.requestId;
    });
    const res = await test(handle).run(Buffer.from(''), { requestId: 'requestId' });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'requestId');
  });

  it('should ok with error', async () => {
    const handle = hook(async () => {
      throw new Error('oops');
    });
    let err;
    try {
      await test(handle).run(Buffer.from(''));
    } catch (ex) {
      err = ex;
    }
    assert.ok(err);
    assert.strictEqual(err.message, 'oops');
  });

  it('should ok with non-async function', async () => {
    const handle = hook(function () {} as any);
    let err;
    try {
      await test(handle).run(Buffer.from(''));
    } catch (ex) {
      err = ex;
    }
    assert.ok(err);
    assert.strictEqual(err.message, 'Must be an AsyncFunction');
  });

  it('should ok with asyncWrap', async () => {
    const handle = asyncWrap(async () => {
      return 'hello world!';
    });
    const res = await test(handle).run(Buffer.from(''));
    assert.strictEqual(res, 'hello world!');
  });

  it('should ok with asyncWrap when error', async () => {
    const handle = asyncWrap(async () => {
      throw new Error('ooops!');
    });
    let err;
    try {
      await test(handle).run(Buffer.from(''));
    } catch (ex) {
      err = ex;
    }

    assert.ok(err);
    assert.strictEqual(err.message, 'ooops!');
  });

  it('should ok with asyncWrap when not async functions', async () => {
    const handle = asyncWrap(function () {} as any);
    let err;
    try {
      await test(handle).run(Buffer.from(''));
    } catch (ex) {
      err = ex;
    }

    assert.ok(err);
    assert.strictEqual(err.message, 'Must be an AsyncFunction');
  });

  it('GET should ok', async () => {
    const handle = hook(async (ctx) => {
      ctx.body = {
        path: ctx.path,
        method: ctx.method,
        query: ctx.query,
        headers: ctx.headers,
        params: ctx.params,
        body: ctx.req.body,
      };
    });
    const q = {
      echostr: 'hehe',
    };
    const event = {
      path: '/wechat',
      httpMethod: 'GET',
      headers: {},
      queryParameters: q,
      pathParameters: {},
      body: '',
      isBase64Encoded: false,
    };
    const data = await test(handle).run(Buffer.from(JSON.stringify(event)), {});
    const body = JSON.parse(data.body);
    assert.strictEqual(body.path, '/wechat');
    assert.strictEqual(body.method, 'GET');
    assert.strictEqual(body.query.echostr, 'hehe');
  });

  it('GET should ok', async () => {
    const handle = hook(async (ctx) => {
      ctx.body = {
        path: ctx.path,
        method: ctx.method,
        query: ctx.query,
        headers: ctx.headers,
        params: ctx.params,
        body: ctx.req.body,
      };
      // ctx.req.body; // second access
      ctx.get('content-type');
      ctx.set('content-type', 'application/json');
      ctx.status = 200;
    });
    const q = {
      echostr: 'hehe',
    };
    const event = {
      path: '/wechat',
      httpMethod: 'GET',
      headers: { 'content-type': 'text/plain' },
      queryParameters: q,
      pathParameters: {},
      body: Buffer.from('hello world').toString('base64'),
      isBase64Encoded: true,
    };
    const data = await test(handle).run(Buffer.from(JSON.stringify(event)), {});
    const body = JSON.parse(data.body);
    assert.strictEqual(body.path, '/wechat');
    assert.strictEqual(body.method, 'GET');
    assert.strictEqual(body.query.echostr, 'hehe');
  });
});
