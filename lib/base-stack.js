const { Construct } = require('@aws-cdk/core');
const SNSAlertStac = require('./sns-stack');
const StepfunctionStack = require('./lambda-stack');
const CodePipelineStack = require('./codepipeline-stack');
const lambda = require('@aws-cdk/aws-lambda');

module.exports = class BaseStackConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    //  stack for SNS
    const sNSAlertStac = new SNSAlertStac(scope, `SNSAlert`);
    // stack for lambda and stack functions

    // cd
    if (!process.env.MANUAL_DEPLOY) {
      const cfnParametersCode = lambda.Code.fromCfnParameters();

      new StepfunctionStack(scope, `Stepfunction`, {
        snsTopic: sNSAlertStac.topic,
        lambdaCode: cfnParametersCode,
      });

      new CodePipelineStack(scope, 'CodepipelienStack', {
        lambdaCode: cfnParametersCode,
        stage: props.stage,
      });
    } else {
      new StepfunctionStack(scope, `Stepfunction`, {
        snsTopic: sNSAlertStac.topic,
      });
    }
  }
};
