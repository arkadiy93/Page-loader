import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import loadPage, { gatherLocalResources, editSourceLinks } from '../src';

describe('download http test', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  afterEach(async () => {
    await rimraf(dir, () => {});
  });

  test('test 1', async () => {
    const fileName = 'hexlet-io-courses.html';
    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    const body = 'Hello from Hexlet!';
    nock(hostname).get(pathname).reply(200, body);

    await loadPage(dir, 'https://hexlet.io/courses');
    const data = await fs.readFile(path.join(dir, fileName), 'utf-8');
    expect(data).toBe(body);
  });

  test('test 2', async () => {
    const testFilePath = path.join(__dirname, '__fixtures__/test2.html');

    const body = await fs.readFile(testFilePath, 'utf-8');
    const fileName = 'hexlet-io-courses.html';
    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    nock(hostname).get(pathname).reply(200, body)
      .get('/courses/photo.jpg')
      .reply(200, 'image')
      .get('/pix/samples/15m.jpg')
      .reply(200, 'second image');
    await loadPage(dir, 'https://hexlet.io/courses');
    const data = await fs.readFile(path.join(dir, fileName), 'utf-8');

    const editedBody = editSourceLinks(body, dir);
    expect(data).toBe(editedBody);
  });
});

describe('additional functions testing', () => {
  test('gather local resources', async () => {
    const testFilePath = path.join(__dirname, '__fixtures__/test.html');
    const data = await fs.readFile(testFilePath, 'utf-8');
    const localResources = gatherLocalResources(data);
    expect(localResources.length).toBe(4);
  });
});
