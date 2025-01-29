import { RemovalPolicy, StackProps } from 'aws-cdk-lib';
import { AnyPrincipal, ArnPrincipal, Effect, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, BucketEncryption, BucketPolicy, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3 extends Construct {
    /** S3バケット */
    public readonly bucket: Bucket;
    /** バケットポリシー */
    private readonly bucketPolicy: BucketPolicy;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id);

        // S3バケットの作成
        this.bucket = new Bucket(this, 'Bucket', {
            bucketName: 'storage-browser-testsample-bucket',
            encryption: BucketEncryption.S3_MANAGED,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
            cors: [
                {
                    allowedHeaders: ['*'],
                    allowedMethods: [
                        HttpMethods.GET,
                        HttpMethods.HEAD,
                        HttpMethods.PUT,
                        HttpMethods.POST,
                        HttpMethods.DELETE,
                    ],
                    allowedOrigins: ['*'],
                    exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag'],
                    maxAge: 3000,
                },
            ],
        });

        // バケットポリシーの作成
        this.bucketPolicy = new BucketPolicy(this, 'BucketPolicy', {
            bucket: this.bucket,
        });

        // HTTPSのみを許可するポリシーを追加
        this.bucketPolicy.document.addStatements(
            new PolicyStatement({
                effect: Effect.DENY,
                principals: [new AnyPrincipal()],
                actions: ['s3:*'],
                resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
                conditions: {
                    Bool: {
                        'aws:SecureTransport': 'false',
                    },
                },
            })
        );
    }

    /**
     * 認証済みロールにバケットアクセス権限を付与
     */
    public addAuthenticatedRolePolicy(authenticatedRole: Role): void {
        this.bucketPolicy.document.addStatements(
            new PolicyStatement({
                effect: Effect.ALLOW,
                principals: [new ArnPrincipal(authenticatedRole.roleArn)],
                actions: ['s3:PutBucketPolicy', 's3:GetBucket*', 's3:List*', 's3:DeleteObject*'],
                resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
            })
        );
    }

/**
 * Amplify用のストレージ設定を取得
 */
public getS3AmplifyConfig() {
    return {
        aws_region: this.bucket.stack.region,
        bucket_name: this.bucket.bucketName,
        buckets: [
            {
                name: this.bucket.bucketName,
                bucket_name: this.bucket.bucketName,
                aws_region: this.bucket.stack.region,
                paths: {
                    // 'public/*': {
                    //     // 認証済みユーザーのみアクセス可能
                    //     'authenticated': ['read', 'write', 'delete']
                    // },
                    'a-company/*': {
                        'authenticated': ['read', 'write', 'delete']
                    },
                    'b-company/*': {
                        'authenticated': ['read', 'write', 'delete']
                    },
                    'c-company/*': {
                        'authenticated': ['read', 'write', 'delete']
                    },
                }
            },
        ],
    };
}
}
