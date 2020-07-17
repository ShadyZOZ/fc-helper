'use strict';

const fs = require('fs');
const linkfs = require('linkfs');
const { patchFs } = require('fs-monkey');
const { ufs } = require('unionfs');
const yaml = require('js-yaml');
const Context = require('./context');

function hook (handler) {
  return function(event, context, callback) {
    if (handler.constructor.name !== 'AsyncFunction') {
      var err = new TypeError('Must be an AsyncFunction');
      return callback(err);
    }

    const ctx = new Context(event, context);

    handler(ctx).then(() => {
      const data = ctx.body;
      var encoded = false;
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
        body: ctx.body
      };
    }).then((response) => {
      callback(null, response);
    }, (err) => {
      callback(err);
    });
  };
}

class Tester {
  constructor(handler) {
    this.handler = handler;
  }

  // TODO: unittest
  mockFromConfig(serviceName, functionName, templatePath = 'template.yml') {
    // read from template.yml
    const template = yaml.load(fs.readFileSync(templatePath, 'utf8'));
    try {
      const envConfig = template.Resources[serviceName][functionName]
        .Properties
        .EnvironmentVariables;
      envConfig && Object.assign(process.env, envConfig);
    } catch (e) {
      throw new Error(`load env config failed: ${e}`);
    }

    try {
      const mountPoints = (
        template.Resources[serviceName]
          .Properties
          .NasConfig || {}
      ).MountPoints || [];
      const rewrites = [];
      for (const mountPoint of mountPoints) {
        const serverAddr = mountPoint.ServerAddr.split(':').join('');
        rewrites.push([mountPoint.MountDir, `${process.cwd()}/.fun/nas/${serverAddr}`]);
      }
      const lfs = linkfs.link(fs, rewrites);
      ufs.use(lfs);
      patchFs(ufs);
    } catch (e) {
      throw new Error(`load mount points failed: ${e}`);
    }
    return this;
  }

  run(event, context) {
    if (!context) {
      context = {};
    }
    return new Promise((resolve, reject) => {
      this.handler(event, context, function (err, result) {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }
}

function test(handler) {
  return new Tester(handler);
}

function asyncWrap(asyncCall) {
  return function (event, context, callback) {
    if (asyncCall.constructor.name !== 'AsyncFunction') {
      var err = new TypeError('Must be an AsyncFunction');
      return callback(err);
    }

    asyncCall(event, context).then((result) => {
      callback(null, result);
    }, (err) => {
      callback(err);
    });
  };
}

module.exports = {
  asyncWrap,
  hook,
  test
};
