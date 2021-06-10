import client from "../src/gt-metrix-client";
import nock from 'nock';

describe('gt-metrix-client', () => {
  test('startTest returns the test id', async () => {
    const parameters = { url: 'www.google.com' };

    nock('https://gtmetrix.com/api/2.0')
      .post('/tests', {         
        data: {
          type: 'test',
          attributes: parameters,
        },
      })
      .reply(200, { data: { id: '102'}});

    return expect(client.startTest(parameters)).resolves.toBe('102');
  });

  test('getTest returns the test data', async () => {
    const testId = '102';
    const response = { data: { id: '102', type: 'test'}};

    nock('https://gtmetrix.com/api/2.0')
      .get('/tests/102')
      .reply(200, response);

    return expect(client.getTest(testId)).resolves.toStrictEqual(response);
  });

  test('getTest follows the location header', async () => {
    const testId = '102';
    const response = { data: { id: '102', type: 'report'}};

    nock('https://gtmetrix.com/api/2.0')
      .get('/tests/102')
      .reply(303, undefined, { Location: '/api/2.0/reports/103' })
      .get('/reports/103')
      .reply(200, response)

    return expect(client.getTest(testId)).resolves.toStrictEqual(response);
  });
});