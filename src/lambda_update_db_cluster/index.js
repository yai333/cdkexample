const aws = require('aws-sdk');
const rds = new aws.RDS();

exports.handler = async function (event) {
  try {
    console.log('event', event);
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
        return rds
          .startDBInstance({
            DBInstanceIdentifier: process.env.dBInstanceName,
          })
          .promise();
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
