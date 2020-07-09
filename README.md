# fc-helper

函数计算 & API 网关辅助库

- [![Build Status](https://travis-ci.org/ShadyZOZ/fc-helper.svg?branch=master)](https://travis-ci.org/ShadyZOZ/fc-helper)

## 原始形式

```js
exports.handle = function(event, context, callback) {
  // 处理 event
  callback(null, {
    isBase64Encoded: false,
    statusCode: statusCode,
    headers: headers,
    body: body
  });
}
```

## 新形式

```js
'use strict';

const { hook } = require('fc-helper');

exports.handle = hook(async function (ctx) {
  ctx.body = 'Hello world!\n';
});
```

会更接近于常见 Web 开发的体验。

## API

### hook 针对 API Gateway 作为前端

将一个 Web 形式的处理单元转化为原始形式。使用方法：

```js
const { hook } = require('fc-helper');

exports.handle = hook(async function(ctx) {
  ctx.body = 'Hello world!\n';
});
```

#### Request

包装后的 Request 对象：具有 path、method、headers、query、params、body只读属性。

可以通过 ctx.path、ctx.method、ctx.

#### Response

包装后的 Response 对象：

可以通过 ctx.type= "" 的方式设置 content-type。

可以通过 ctx.status= 200 的方式设置 statusCode。

可以通过 ctx.set('key', 'value') 的方式设置任意用于响应的 headers。

可以通过 ctx.body= 的方式设置 body。如果没有设置 content-type，会根据 body 类型自动设置 content-type。

- string，会自动填充类型为 text/plain
- object，会自动填充类型为 application/json

#### Context

即上文中的 ctx。ctx 除了上述的几个字段外，还包含 requestId、credentials、function 字段，即原始的 context 对象的属性。

### asyncWrap 针对普通的函数

调用 return 返回的值，即结果。开发者可以编写顺序式的业务逻辑，远离回调。

```js
'use strict';

const { asyncWrap } = require('fc-helper');

exports.handle = asyncWrap(async function (event, context) {
  return 'hello world!';
});
```

### 测试支持

提供 test 方法，将一个函数变成一个可执行的 case，然后通过 run 方法执行。返回一个 Promise 对象。

```js
const { test, asyncWrap } = require('fc-helper');

var handle = asyncWrap(async function (event, context) {
  return 'hello world!';
});
const res = await test(handle).run('', '');
assert.equal(res, 'hello world!');
```

run(event, contenxt) 方法接受两个参数，event 和 contentx。我们通过修改这两个值来 mock 真实环境的输入。

## License
The MIT license
