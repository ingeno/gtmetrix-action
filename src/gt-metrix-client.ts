import got, { Got } from 'got';
import * as core from '@actions/core';

export type StartTestParameters = {
  adblock?: boolean;
  allow_url?: string;
  block_url?: string;
  browser?: string;
  browser_dppx?: number;
  browser_height?: number;
  browser_width?: number;
  browser_rotate?: boolean;
  cookies?: string;
  dns?: string;
  httpauth_username?: string;
  httpauth_password?: string;
  location?: string;
  report?: string;
  retention?: number;
  simulate_device?: string;
  stop_onload?: boolean;
  throttle?: string;
  url: string;
  user_agent?: string;
  video?: boolean;
};

export type ErroredTest = {
  data: {
    type: 'test';
    id: string;
    attributes: {
      state: 'error';
      error: string;
    };
  };
};

export type Test = {
  data: {
    type: 'test';
    id: string;
    attributes: {
      state: 'completed' | 'queued' | 'started';
    };
  };
};

export type TestData = Test | ErroredTest;

export type ReportData = {
  data: {
    type: 'report';
    id: string;
    attributes: { [key: string]: number | string };
    links: { [key: string]: string };
  };
};

export class GTMetrixClient {
  private readonly client: Got;

  constructor(apiKey: string) {
    this.client = got.extend({
      prefixUrl: 'https://gtmetrix.com/api/2.0/',
      username: apiKey,
      responseType: 'json',
    });
  }

  async startTest(parameters: StartTestParameters): Promise<string> {
    const { body } = await this.client.post<TestData>('tests', {
      headers: { 'Content-Type': 'application/vnd.api+json' },
      json: {
        data: {
          type: 'test',
          attributes: parameters,
        },
      },
    });
    return body.data.id;
  }

  async getTest(testId: string): Promise<TestData | ReportData> {
    const { body } = await this.client.get<TestData>(`tests/${testId}`);
    return body;
  }
}

export default new GTMetrixClient(core.getInput('api_key', { required: true }));
