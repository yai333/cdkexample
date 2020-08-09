const { Stack } = require('@aws-cdk/core');
const sns = require('@aws-cdk/aws-sns');
const subs = require('@aws-cdk/aws-sns-subscriptions');

const EMAIL_SUBSCRIPTION = 'test@test.com';
module.exports = class SNSAlertStac extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.topic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'Step function execution failed',
    });
    this.topic.addSubscription(new subs.EmailSubscription(EMAIL_SUBSCRIPTION));
  }
};
