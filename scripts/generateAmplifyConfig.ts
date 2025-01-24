import { writeFileSync } from 'fs';
import { join } from 'path';
import { CloudFormation } from '@aws-sdk/client-cloudformation';

/**
 * CloudFormationからスタックの出力を取得する関数
 */
async function getStackOutputs() {
    const cfn = new CloudFormation({ region: 'ap-northeast-1' });

    // CDKのスタック名を定義
    const stackName = 'CdkStack';

    const { Stacks } = await cfn.describeStacks({ StackName: stackName });
    const outputs = Stacks?.[0]?.Outputs ?? [];

    // AmplifyOutputsを探して解析
    const amplifyOutput = outputs.find(output => output.OutputKey === 'AmplifyOutputs');
    if (!amplifyOutput?.OutputValue) {
        throw new Error('AmplifyOutputs not found in stack outputs');
    }

    return JSON.parse(amplifyOutput.OutputValue);
}

/**
 * 設定ファイルを生成する関数
 */
async function generateOutputs() {
    try {
        const outputs = await getStackOutputs();
        writeFileSync(
            join(process.cwd(), 'amplify_outputs.json'),
            JSON.stringify(outputs, null, 2)
        );
        console.log('✅ Generated amplify_outputs.json successfully');
    } catch (error) {
        console.error('❌ Failed to generate amplify_outputs.json:', error);
        process.exit(1);
    }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
    generateOutputs();
}
