import { AccountRecovery, CfnIdentityPool, UserPool, UserPoolClient, VerificationEmailStyle } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { StackProps } from 'aws-cdk-lib';

export interface CognitoProps extends StackProps {
    bucketName: string;
}

export class Cognito extends Construct {
    /** IDプール */
    public readonly identityPool: CfnIdentityPool;
    /** ユーザープール */
    public readonly userPool: UserPool;
    /** ユーザープールクライアント */
    public readonly userPoolClient: UserPoolClient;

    constructor(scope: Construct, id: string, props: CognitoProps) {
        super(scope, id);

        // ユーザープールの作成
        this.userPool = new UserPool(this, 'UserPool', {
            userPoolName: 'storage-browser-sample-user-pool',
            signInAliases: {
                email: true,
                username: true
            },
            selfSignUpEnabled: false,
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            userVerification: {
                emailStyle: VerificationEmailStyle.CODE
            },
            passwordPolicy: {
                minLength: 6, //length:6~99
                requireLowercase: false,
                requireUppercase: false,
                requireDigits: false,
                requireSymbols: false
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true
                }
            }
        });

        // ユーザープールクライアントの作成
        this.userPoolClient = this.userPool.addClient('UserPoolClient', {
            userPoolClientName: 'storage-browser-sample-user-pool-client',
            authFlows: {
                adminUserPassword: true,
                userPassword: true,
                userSrp: true
            }
        });

        // IDプールの作成
        this.identityPool = new CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: 'storage-browser-sample-identity-pool',
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName
                }
            ]
        });
    }

    // Amplify用の認証設定を取得
    public getCognitoAmplifyConfig() {
        return {
            user_pool_id: this.userPool.userPoolId,
            aws_region: this.userPool.stack.region,
            user_pool_client_id: this.userPoolClient.userPoolClientId,
            identity_pool_id: this.identityPool.ref,
            mfa_methods: [],
            standard_required_attributes: ['username'],
            username_attributes: ['username'],
            user_verification_types: ['username'],
            groups: [],
            mfa_configuration: 'NONE',
            password_policy: {
                min_length: 6,
                require_lowercase: false,
                require_numbers: false,
                require_symbols: false,
                require_uppercase: false
            },
            unauthenticated_identities_enabled: false
        };
    }
}
