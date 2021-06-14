import * as fs from 'fs';
import * as core from '@actions/core';
import pWaitFor from 'p-wait-for';
import * as yaml from 'js-yaml';
import { Table } from 'console-table-printer';
import { Configuration } from './configuration';
import client, { ReportData, TestData } from './gt-metrix-client';
import { compare } from './compare';

const DEFAULT_POLL_INTERVAL = 3;

export async function run(): Promise<void> {
  try {
    const configuration = yaml.load(
      fs.readFileSync(core.getInput('configuration_file', { required: true }), 'utf-8'),
    ) as Configuration;
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
      { interval: (configuration.poll_interval || DEFAULT_POLL_INTERVAL) * 1000 },
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
    outputReportResponse(report);
  } catch (error) {
    core.setFailed(error.message);
  }
}

const outputReportResponse = (report: ReportData) => {
  const attributes = report.data.attributes;
  const outputReportAttribute = (key: string) => {
    if (attributes[key] !== undefined) {
      core.setOutput(key, attributes[key]);
    }
  };

  const links = report.data.links;
  const outputReportLink = (key: string) => {
    links[key] !== undefined && core.setOutput(key, links[key]);
  };

  outputReportAttribute('gtmetrix_grade');
  outputReportAttribute('performance_score');
  outputReportAttribute('structure_score');
  outputReportAttribute('pagespeed_score');
  outputReportAttribute('yslow_score');
  outputReportAttribute('html_bytes');
  outputReportAttribute('page_bytes');
  outputReportAttribute('page_requests');
  outputReportAttribute('redirect_duration');
  outputReportAttribute('connect_duration');
  outputReportAttribute('backend_duration');
  outputReportAttribute('time_to_first_byte');
  outputReportAttribute('first_paint_time');
  outputReportAttribute('first_contentful_paint');
  outputReportAttribute('dom_interactive_time');
  outputReportAttribute('dom_content_loaded_time');
  outputReportAttribute('dom_content_loaded_duration');
  outputReportAttribute('onload_time');
  outputReportAttribute('onload_duration');
  outputReportAttribute('fully_loaded_time');
  outputReportAttribute('rum_speed_index');
  outputReportAttribute('speed_index');
  outputReportAttribute('largest_contentful_paint');
  outputReportAttribute('time_to_interactive');
  outputReportAttribute('total_blocking_time');
  outputReportAttribute('cumulative_layout_shift');

  outputReportLink('har');
  outputReportLink('video');
  outputReportLink('report_pdf');
  outputReportLink('report_pdf_full');
  outputReportLink('report_url');
  outputReportLink('screenshot');
  outputReportLink('optimized_images');
  outputReportLink('lighthouse');
  outputReportLink('pagespeed');
  outputReportLink('pagespeed_files');
  outputReportLink('yslow');
};

run();
