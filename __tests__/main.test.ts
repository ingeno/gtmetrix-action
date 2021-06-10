import { run } from '../src/main';
import client from '../src/gt-metrix-client';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as core from "@actions/core";
import { Configuration } from '../src/configuration';
import { mocked } from 'ts-jest/utils';
import report from './report.json';
import regression from './regression-report.json';

jest.mock('../src/gt-metrix-client')

process.env.INPUT_CONFIGURATION_FILE = "./__tests__/config.yml";

const configuration = yaml.load(fs.readFileSync('./config.yml', 'utf-8')) as Configuration;

describe('run', () => {
  afterEach(jest.resetAllMocks);

  test('starts the test with the configuration', async () => {
    mocked(client.startTest).mockResolvedValue('800');
    mocked(client.getTest).mockResolvedValueOnce({ data: { id: '800', type: 'test', attributes: { state: 'queued'}}});
    mocked(client.getTest).mockResolvedValueOnce({ data: { id: '800', type: 'test', attributes: { state: 'started'}}});
    mocked(client.getTest).mockResolvedValueOnce(report as any);

    await run();

    expect(client.startTest).toHaveBeenCalledWith(configuration.test_configuration);
  });

  test('fails when the test state is error', async () => {
    mocked(client.startTest).mockResolvedValue('800');
    mocked(client.getTest).mockResolvedValueOnce({ data: { id: '800', type: 'test', attributes: { state: 'queued'}}});
    mocked(client.getTest).mockResolvedValueOnce({ data: { id: '800', type: 'test', attributes: { state: 'error', error: 'boom'}}});
    const setFailedSpy = jest.spyOn(core, 'setFailed');

    await run();

    expect(setFailedSpy).toHaveBeenCalledWith(`❌ GTMetrix test ended in error: boom`);
  });

  test('given config has no requirements should output basic result', async () => {
    process.env.INPUT_CONFIGURATION_FILE = "./__tests__/config-no-requirements.yml";
    mocked(client.startTest).mockResolvedValue('800');
    mocked(client.getTest).mockResolvedValueOnce({ data: { id: '800', type: 'test', attributes: { state: 'queued'}}});
    mocked(client.getTest).mockResolvedValueOnce(report as any);
    const infoSpy = jest.spyOn(core, 'info');

    await run();

    expect(infoSpy).toHaveBeenLastCalledWith(expect.not.stringContaining("reference"))
  });

  test('given config has requirements and does not meet all should fail', async () => {
    process.env.INPUT_CONFIGURATION_FILE = "./__tests__/config.yml";
    mocked(client.startTest).mockResolvedValue('800');
    mocked(client.getTest).mockResolvedValueOnce({ data: { id: '800', type: 'test', attributes: { state: 'queued'}}});
    mocked(client.getTest).mockResolvedValueOnce(regression as any);
    const setFailedSpy = jest.spyOn(core, 'setFailed');

    await run();

    expect(setFailedSpy).toHaveBeenCalledWith(`❌ Some metrics regressed`);
  });

  test('given config has requirements and meet all should not fail', async () => {
    process.env.INPUT_CONFIGURATION_FILE = "./__tests__/config.yml";
    mocked(client.startTest).mockResolvedValue('800');
    mocked(client.getTest).mockResolvedValueOnce({ data: { id: '800', type: 'test', attributes: { state: 'queued'}}});
    mocked(client.getTest).mockResolvedValueOnce(report as any);
    const setFailedSpy = jest.spyOn(core, 'setFailed');

    await run();

    expect(setFailedSpy).not.toHaveBeenCalledWith(`❌ Some metrics regressed`);
  });

  test('given config has requirements should output advanced result', async () => {
    process.env.INPUT_CONFIGURATION_FILE = "./__tests__/config.yml";
    mocked(client.startTest).mockResolvedValue('800');
    mocked(client.getTest).mockResolvedValueOnce({ data: { id: '800', type: 'test', attributes: { state: 'queued'}}});
    mocked(client.getTest).mockResolvedValueOnce(report as any);
    const infoSpy = jest.spyOn(core, 'info');

    await run();

    expect(infoSpy).toHaveBeenLastCalledWith(expect.stringContaining("reference"))
  });
});