import { join } from 'path';
import { config as commonConfig } from './wdio-common.conf';

const config: WebdriverIO.Config = {
  ...commonConfig,
  capabilities: [
    {
      browserName: 'electron',
      'wdio:electronServiceOptions': {
        appBinaryPath: join(
          process.cwd(),
          'packages',
          'win-unpacked',
          'Mockoon.exe'
        ),
        appArgs: [
          'user-data-dir=' + join(process.cwd(), 'tmp'),
          '--enable-dev-tools'
        ]
      }
    }
  ]
};

export { config };
