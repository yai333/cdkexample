#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { LucretiaScheduleEc2Stack } = require('../lib/lucretia-schedule-ec2-stack');

const app = new cdk.App();
new LucretiaScheduleEc2Stack(app, 'LucretiaScheduleEc2Stack');
