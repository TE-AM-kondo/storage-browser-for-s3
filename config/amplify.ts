import { Amplify } from 'aws-amplify';
import config from '../amplify_outputs.json';

export function configureAmplify() {
    Amplify.configure(config);
}
