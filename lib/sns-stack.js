const { Stack } = require('@aws-cdk/core');
const sns = require('@aws-cdk/aws-sns');
const subs = require('@aws-cdk/aws-sns-subscriptions');

module.exports = class SNSAlertStac extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.topic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'Alarm for step function',
    });
    this.topic.addSubscription(new subs.EmailSubscription('test@test.com'));
  }
};
