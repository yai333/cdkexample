const cdk = require('@aws-cdk/core');
const codebuild = require('@aws-cdk/aws-codebuild');
const codepipeline = require('@aws-cdk/aws-codepipeline');
const codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
const ssm = require('@aws-cdk/aws-ssm');
const packageJson = require('../package.json');

class CodePipelineStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const sourceOutput = new codepipeline.Artifact();
    const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');
    const lambdaBuildOutput = new codepipeline.Artifact('LambdaBuildOutput');
    const branch = props.stage === 'dev' ? 'dev' : 'master';
    new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `DeployScheduleService-${props.stage}`,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'Code',
              output: sourceOutput,
              oauthToken: ssm.StringParameter.valueForStringParameter(
                this,
                '/github/token'
              ),
              owner: 'yai333',
              branch,
              repo: 'cdkexample',
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_CDK_LAMBDA',
              project: new codebuild.PipelineProject(this, 'Build', {
                buildSpec: codebuild.BuildSpec.fromObject({
                  version: +`${
                    packageJson.version.split('.')[0]
                  }.${+packageJson.version.split('.').slice(-2).join('')}`,
                  phases: {
                    install: {
                      commands: 'npm install',
                    },
                    build: {
                      commands: `export DEPLOY_ENV=${props.stage} && npm run cdk synth`,
                    },
                    post_build: {
                      commands: ['cd src && npm install', 'ls src -la'],
                    },
                  },
                  // save the generated files in the correct artifacts
                  artifacts: {
                    'secondary-artifacts': {
                      CdkBuildOutput: {
                        'base-directory': 'cdk.out',
                        files: ['**/*'],
                      },
                      LambdaBuildOutput: {
                        'base-directory': 'src',
                        files: ['**/*'],
                      },
                    },
                  },
                }),
              }),
              input: sourceOutput,
              outputs: [cdkBuildOutput, lambdaBuildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'Deploy_SNS_Stack',
              templatePath: cdkBuildOutput.atPath(
                `SNSAlert-${props.stage}.template.json`
              ),
              stackName: `SNSStack-${props.stage}`,
              adminPermissions: true,
            }),
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'Deploy_Lambda_Stack',
              templatePath: cdkBuildOutput.atPath(
                `Stepfunction-${props.stage}.template.json`
              ),
              stackName: `StepfunctionStack-${props.stage}`,
              adminPermissions: true,
              parameterOverrides: {
                ...props.lambdaCode.assign(lambdaBuildOutput.s3Location),
              },
              extraInputs: [lambdaBuildOutput],
              runOrder: 2,
            }),
          ],
        },
      ],
    });
  }
}

module.exports = CodePipelineStack;
