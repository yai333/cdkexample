const aws = require('aws-sdk');
const rds = new aws.RDS();

exports.handler = async function (event) {
  try {
    console.log('event', event);
    const params = {
      DBClusterIdentifier: process.env.dBInstanceName,
      MaxRecords: 20,
    };
    const dbclustersRes = await rds.describeDBClusters(params).promise();
    const { DBClusters } = dbclustersRes;
    const { Status } = DBClusters[0];
    console.log('Status', Status);
    switch (Status) {
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
        return Status;
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};
