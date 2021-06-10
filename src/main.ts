import * as fs from 'fs';
import * as core from '@actions/core';
import pWaitFor from 'p-wait-for';
import * as yaml from 'js-yaml';
import { Table } from 'console-table-printer';
import { Configuration } from './configuration';
import client, { ReportData, TestData } from './gt-metrix-client';
import { compare } from './compare';

export async function run(): Promise<void> {
  try {
    const configuration = yaml.load(fs.readFileSync(core.getInput('configuration_file'), 'utf-8')) as Configuration;
    core.info('🚀 Launching test...');
    const testId = await client.startTest(configuration.test_configuration);
    core.info(`👌 Test launched with id [${testId}]`);

    let test: TestData | ReportData = await client.getTest(testId);
    await pWaitFor(
      async () => {
        core.info('⏱  Polling test until completion...');
        test = await client.getTest(testId);
        return test.data.type === 'report' || test.data.attributes.state === 'error';
      },
      { interval: configuration.poll_interval * 1000 },
    );

    if (test.data.attributes.state === 'error') {
      core.setFailed(`❌ GTMetrix test ended in error: ${test.data.attributes.error}`);
      return;
    }

    const table = new Table();
    const report = test as ReportData;
    const attributes = report.data.attributes;
    const reportedAttributes = Object.keys(attributes)
      .filter((key) => !['browser', 'location', 'source'].includes(key))
      .sort();

    if (!configuration.requirements) {
      reportedAttributes.forEach((metric) => {
        table.addRow({ metric, value: attributes[metric] });
      });
    } else {
      configuration.requirements;
      const metricsSuccess: boolean[] = [];
      reportedAttributes.forEach((metric) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const reference = configuration.requirements![metric];
        const value = attributes[metric];
        const success = compare(metric, reference, value);
        metricsSuccess.push(success);

        const rowConfig =
          reference === undefined ? { reference: '-', color: 'white' } : { reference, color: success ? 'green' : 'red' };
        table.addRow({ metric, reference: rowConfig.reference, value }, { color: rowConfig.color });
      });

      if (metricsSuccess.some((success) => success === false)) {
        core.setFailed('❌ Some metrics regressed');
      }
    }
    core.info(`📖 Report is available at ${report.data.links['report_url']}`);
    core.info(table.table.renderTable());
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
