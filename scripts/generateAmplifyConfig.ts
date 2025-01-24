import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * CDKの出力から設定ファイルを生成する関数
 */
async function generateOutputs() {
    try {
        // CDKデプロイ時の標準出力から設定を取得
        const cdkOutput = process.env.CDK_OUTPUTS;
        if (!cdkOutput) {
            throw new Error('CDK_OUTPUTS environment variable not found');
        }

        const config = JSON.parse(cdkOutput);
        writeFileSync(
            join(process.cwd(), 'amplify_outputs.json'),
            JSON.stringify(config, null, 2)
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