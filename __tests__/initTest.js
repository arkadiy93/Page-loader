import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';
import pageLoader from '../src';

test('first test', async () => {
  const dir = `${os.tmpdir()}`;
  const fileName = 'hexlet-io-courses.html';
  nock('https://hexlet.io')
    .get('/courses')
    .reply(200, 'Hello from Hexlet!');

  await pageLoader(dir, 'https://hexlet.io/courses');
  const data = await fs.readFile(path.join(dir, fileName), 'utf-8');
  expect(data).toBe('Hello from Hexlet!');
});
