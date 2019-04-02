import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import pageLoader from '../src';

test('first test', async () => {
  const path = `${os.tmpdir()}`;
  nock('https://hexlet.io')
    .get('/courses')
    .reply(200, 'Hello from Hexlet!');

  await pageLoader(path, 'https://hexlet.io/courses');
  const data = await fs.readFile(`${path}/lol.html`, 'utf-8');
  expect(data).toBe('Hello from Hexlet!');
});
