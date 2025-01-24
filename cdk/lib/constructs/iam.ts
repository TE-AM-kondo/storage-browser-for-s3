import { StackProps } from 'aws-cdk-lib';
import { CfnIdentityPool, CfnIdentityPoolRoleAttachment } from 'aws-cdk-lib/aws-cognito';
import { Effect, FederatedPrincipal, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * IAMのプロパティ
 */
export interface IamProps extends StackProps {
    /** S3バケット名 */
    bucketName: string;
    /** Cognito Identity Pool */
    identityPool: CfnIdentityPool;
}

/**
 * IAMリソース
 * Cognito認証済みユーザー用のロールとポリシーを作成する
 */
export class Iam extends Construct {
    /** 認証済みユーザー用のロール */
    public readonly authenticatedRole: Role;

    constructor(scope: Construct, id: string, props: IamProps) {
        super(scope, id);

        // 認証済みユーザー用のロールを作成
        this.authenticatedRole = new Role(this, 'AuthenticatedRole', {
            roleName: 'storage-browser-sample-auth-role',
            assumedBy: new FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': props.identityPool.ref,
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated',
                    },
                },
                'sts:AssumeRoleWithWebIdentity'
            ),
        });

        // パスごとのポリシー設定
        const pathConfigs = [
            {
                path: 'public/*',
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
            },
            {
                path: 'protected/{entity_id}/*',
                actions: ['s3:GetObject', 's3:ListBucket'],
            },
            {
                path: 'private/{entity_id}/*',
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
                conditions: {
                    'StringLike': {
                        'cognito-identity.amazonaws.com:sub': '${cognito-identity.amazonaws.com:sub}'
                    }
                }
            }
        ];

        // パスごとにポリシーを作成
        for (const config of pathConfigs) {
            // GetObject, PutObject, DeleteObject用のポリシー
            const objectActions = config.actions.filter(action => action !== 's3:ListBucket');
            if (objectActions.length > 0) {
                this.authenticatedRole.addToPolicy(
                    new PolicyStatement({
                        actions: objectActions,
                        resources: [`arn:aws:s3:::${props.bucketName}/${config.path}`],
                        effect: Effect.ALLOW,
                        conditions: config.conditions,
                    })
                );
            }

            // ListBucket用のポリシー
            if (config.actions.includes('s3:ListBucket')) {
                this.authenticatedRole.addToPolicy(
                    new PolicyStatement({
                        actions: ['s3:ListBucket'],
                        resources: [`arn:aws:s3:::${props.bucketName}`],
                        effect: Effect.ALLOW,
                        conditions: {
                            StringLike: {
                                's3:prefix': [config.path, config.path.replace('/*', '/')],
                            },
                            ...config.conditions,
                        },
                    })
                );
            }
        }

        // IdentityPoolにロールをアタッチ
        new CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
            identityPoolId: props.identityPool.ref,
            roles: {
                authenticated: this.authenticatedRole.roleArn,
            },
        });
    }
}
