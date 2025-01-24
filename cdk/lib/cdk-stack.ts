import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { S3 } from './constructs/s3';
import { Cognito } from './constructs/cognito';
import { Iam } from './constructs/iam';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

        // S3リソースを作成
        const s3 = new S3(this, 'S3', {
          ...props,
      });

      // Cognitoリソースを作成
      const cognito = new Cognito(this, 'Cognito', {
          ...props,
          bucketName: s3.bucket.bucketName,
      });

      // IAMリソースを作成
      const iam = new Iam(this, 'IAM', {
          ...props,
          bucketName: s3.bucket.bucketName,
          identityPool: cognito.identityPool,
      });

      // S3バケットに認証済みロールのポリシーを追加
      s3.addAuthenticatedRolePolicy(iam.authenticatedRole);

      // Amplify設定をJSON形式で出力
      const amplifyOutputs = {
          auth: cognito.getCognitoAmplifyConfig(),
          storage: s3.getS3AmplifyConfig(props),
          version: '1.3',
      };

      // Amplify設定を出力
      new cdk.CfnOutput(this, 'AmplifyOutputs', {
          value: JSON.stringify(amplifyOutputs),
      });
  }
}
