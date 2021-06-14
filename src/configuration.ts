import { StartTestParameters } from './gt-metrix-client';

export type Requirements = {
  [metricKey: string]: number | string;
};

export type Configuration = {
  poll_interval?: number;
  requirements?: Requirements;
  test_configuration: StartTestParameters;
};
