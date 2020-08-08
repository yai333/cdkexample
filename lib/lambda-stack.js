const { Stack, ScopedAws, Duration } = require('@aws-cdk/core');
const { Function, Runtime, Code } = require('@aws-cdk/aws-lambda');
const { PolicyStatement } = require('@aws-cdk/aws-iam');
const { SfnStateMachine } = require('@aws-cdk/aws-events-targets');
const { Rule, Schedule } = require('@aws-cdk/aws-events');
const ssm = require('@aws-cdk/aws-ssm');
const sfn = require('@aws-cdk/aws-stepfunctions');
const tasks = require('@aws-cdk/aws-stepfunctions-tasks');
const { join } = require('path');

module.exports = class StepfunctionStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // get autoscaling group name and rds db cluster name from SSM
    const autoScalingGroupName = ssm.StringParameter.valueForStringParameter(
      this,
      '/cdksample/autoscalling/name'
    );
    const dBInstanceName = ssm.StringParameter.valueForStringParameter(
      this,
      '/cdksample/dbcluster/name'
    );

    const { accountId, region } = new ScopedAws(this);

    //create lambda functions
    const updateScalingGroupFn = new Function(this, 'updateScalingGroupFn', {
      runtime: Runtime.NODEJS_12_X,
      handler: 'lambda_update_asg/index.handler',
      code: props.lambdaCode || Code.fromAsset(join(__dirname, '../src')),
      environment: {
        autoScalingGroupName,
      },
    });

    const updateDBClusterFn = new Function(this, 'updateDBCluster', {
      runtime: Runtime.NODEJS_12_X,
      handler: 'lambda_update_db_cluster/index.handler',
      code: props.lambdaCode || Code.fromAsset(join(__dirname, '../src')),
      environment: {
        dBInstanceName,
      },
    });

    //create Step function
    const updateScalingGroupTask = new tasks.LambdaInvoke(
      this,
      'Update asg task',
      {
        lambdaFunction: updateScalingGroupFn,
      }
    );
    const updateDBClusterTask = new tasks.LambdaInvoke(
      this,
      'StopStart db cluster task',
      {
        lambdaFunction: updateDBClusterFn,
      }
    );

    //existing sns topic
    // const topic = sns.Topic.fromTopicArn(
    //   this,
    //   'ExistingAlertSNSTopic',
    //   `arn:aws:sns:${region}:${accountId}:Alert`
    // );

    const sendFailureNotification = new tasks.SnsPublish(
      this,
      'Publish alert notification',
      {
        topic: props.snsTopic,
        message: sfn.TaskInput.fromDataAt('$.error'),
      }
    );

    //updateDBClusterTask.addCatch(sendFailureNotification);

    const stepChain = new sfn.Parallel(
      this,
      'Stop and Start EC2 Instances and RDS in parallel'
    )
      .branch(updateScalingGroupTask)
      .branch(updateDBClusterTask)
      .addCatch(sendFailureNotification);

    const toggleAWSServices = new sfn.StateMachine(this, 'StateMachine', {
      definition: stepChain,
      timeout: Duration.minutes(5),
    });

    //IAM policies for updateScalingGroupFn lambda
    const statementUpdateASLGroup = new PolicyStatement();
    statementUpdateASLGroup.addActions('autoscaling:UpdateAutoScalingGroup');
    statementUpdateASLGroup.addResources(
      `arn:aws:autoscaling:${region}:${accountId}:autoScalingGroup:*:autoScalingGroupName/${autoScalingGroupName}`
    );
    updateScalingGroupFn.addToRolePolicy(statementUpdateASLGroup);

    const statementDescribeASLGroup = new PolicyStatement();
    statementDescribeASLGroup.addActions(
      'autoscaling:DescribeAutoScalingGroups'
    );
    statementDescribeASLGroup.addResources('*');
    updateScalingGroupFn.addToRolePolicy(statementDescribeASLGroup);

    //IAM policies for updateDBCluster lambda
    const statementDescribeDBCluster = new PolicyStatement();
    statementDescribeDBCluster.addActions('rds:DescribeDBClusters');
    statementDescribeDBCluster.addResources('*');
    updateDBClusterFn.addToRolePolicy(statementDescribeDBCluster);

    const statementToggleDBCluster = new PolicyStatement();
    statementToggleDBCluster.addActions([
      'rds:StartDBCluster',
      'rds:StopDBCluster',
    ]);
    statementToggleDBCluster.addResources('*');
    updateDBClusterFn.addToRolePolicy(statementToggleDBCluster);

    //cloud watch event
    new Rule(this, 'Rule', {
      schedule: Schedule.expression('cron(0 8,18 * * ? *)'),
      targets: [new SfnStateMachine(toggleAWSServices)],
    });
  }
};
