#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const BaseStackConstruct = require('../lib/base-stack');

const deployEnv = process.env.DEPLOY_ENV || 'dev';
const app = new cdk.App();
new BaseStackConstruct(app, `CDKSample`, {
  env: { region: 'ap-southeast-2' },
  stage: deployEnv,
});
