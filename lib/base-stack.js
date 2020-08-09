const { Construct } = require('@aws-cdk/core');
const SNSAlertStac = require('./sns-stack');
const StepfunctionStack = require('./lambda-stack');
const CodePipelineStack = require('./codepipeline-stack');
const lambda = require('@aws-cdk/aws-lambda');

module.exports = class BaseStackConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    //  stack for SNS
    const sNSAlertStac = new SNSAlertStac(scope, `SNSAlert-${props.stage}`);

    // Deploy step functions from codepipeline
    if (!process.env.MANUAL_DEPLOY) {
      const cfnParametersCode = lambda.Code.fromCfnParameters();

      new StepfunctionStack(scope, `Stepfunction-${props.stage}`, {
        snsTopic: sNSAlertStac.topic,
        lambdaCode: cfnParametersCode,
        stage: props.stage,
      });

      new CodePipelineStack(scope, `CodepipelienStack-${props.stage}`, {
        lambdaCode: cfnParametersCode,
        stage: props.stage,
      });
    } else {
      //deploy step function from local env
      new StepfunctionStack(scope, `Stepfunction-dev`, {
        snsTopic: sNSAlertStac.topic,
        stage: 'dev',
      });
    }
  }
};
