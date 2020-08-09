const aws = require('aws-sdk');
const { isWeekend, getHours } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');

const rds = new aws.RDS();
const START_TIME = 9;
const TIMEZONE = 'Australia/Melbourne';
exports.handler = async function (event) {
  try {
    console.log('event', event);
    const { time = new Date() } = event;
    const localEventDatetime = utcToZonedTime(time, TIMEZONE);
    console.log('localEventDatetime', localEventDatetime);
    const hours = getHours(localEventDatetime);
    const params = {
      DBInstanceIdentifier: process.env.dBInstanceName,
      MaxRecords: 20,
    };
    const dbInstancesRes = await rds.describeDBInstances(params).promise();
    const { DBInstances } = dbInstancesRes;
    const { DBInstanceStatus: status } = DBInstances[0];
    console.log('Status', status);
    switch (status) {
      case 'stopped':
        if (hours <= START_TIME && !isWeekend(localEventDatetime)) {
          rds
            .startDBInstance({
              DBInstanceIdentifier: process.env.dBInstanceName,
            })
            .promise();
        }
        break;
      case 'available':
        return rds
          .stopDBInstance({
            DBInstanceIdentifier: process.env.dBInstanceName,
          })
          .promise();
      default:
        return status;
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};
