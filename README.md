# Creating a Instance Scheduler using AWS CDK

A pipeline to deploy a serverless solution that start and stop Amazon EC2 instances in an autoscalling group and Amazon RDS instances based on a schedule.

## Deploy step function locally

```
export MANUAL_DEPLOY=true && cdk deploy Stepfunction-dev
```

## Deployment to dev stage

pipeline source action targets to dev branch.

```
export DEPLOY_ENV=dev && cdk deploy CodepipelienStack-dev
```

## Deployment to production stage

pipeline source action targets to master branch.

```
export DEPLOY_ENV=dev && cdk deploy CodepipelienStack-dev
```
