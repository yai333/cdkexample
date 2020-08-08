const aws = require('aws-sdk');
const { isWeekend, getHours } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');

const START_TIME = 9;
const TIMEZONE = 'Australia/Melbourne';
const autoscaling = new aws.AutoScaling();
exports.handler = async function (event) {
  try {
    console.log('event', event);
    const localEventDate = utcToZonedTime(new Date(), TIMEZONE);
    console.log('localEventDate', localEventDate);
    const hours = getHours(localEventDate);
    const asgRes = await autoscaling
      .describeAutoScalingGroups({
        AutoScalingGroupNames: [process.env.autoScalingGroupName],
      })
      .promise();
    const { AutoScalingGroups } = asgRes;
    const { MinSize, MaxSize } = AutoScalingGroups[0];
    let params;
    if (
      MinSize === 0 &&
      MaxSize === 0 &&
      hours <= START_TIME &&
      !isWeekend(localEventDate)
    ) {
      params = {
        AutoScalingGroupName: process.env.autoScalingGroupName,
        MaxSize: 1,
        MinSize: 1,
        DesiredCapacity: 1,
      };
    } else if (MinSize > 0) {
      params = {
        AutoScalingGroupName: process.env.autoScalingGroupName,
        MaxSize: 0,
        MinSize: 0,
      };
    }
    console.log('MinSize', MinSize);
    console.log('MaxSize', MaxSize);
    console.log('params', params);
    if (!params) return;
    return autoscaling.updateAutoScalingGroup(params).promise();
  } catch (error) {
    console.log(error);
    return error;
  }
};
