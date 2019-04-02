import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';
import pageLoader from '../src';

describe('download http test', () => {
  let dir;
  beforeAll(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  test('initial test', async () => {
    const fileName = 'hexlet-io-courses.html';
    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    const body = 'Hello from Hexlet!';
    nock(hostname).get(pathname).reply(200, body);

    await pageLoader(dir, 'https://hexlet.io/courses');
    const data = await fs.readFile(path.join(dir, fileName), 'utf-8');
    expect(data).toBe('Hello from Hexlet!');
  });
});
