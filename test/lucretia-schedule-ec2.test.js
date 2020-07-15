const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const LucretiaScheduleEc2 = require('../lib/lucretia-schedule-ec2-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new LucretiaScheduleEc2.LucretiaScheduleEc2Stack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
