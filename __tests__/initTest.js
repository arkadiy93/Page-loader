import nock from 'nock';
import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import debug from 'debug';
import { flatten } from 'lodash/fp';
import loadPage, { gatherLocalResources, editSourceLinks } from '../src';

const testLog = debug('page-loader:tests');


describe('download http test', () => {
  let dir;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  afterEach(async () => {
    await rimraf(dir, () => {});
  });

  test('test 1', async () => {
    testLog('initiating test 1');
    const testFilePath = path.join(__dirname, '__fixtures__/html/test1.html');
    const resourcesFolderName = path.join(dir, 'hexlet-io-courses_files');
    const body = await fs.readFile(testFilePath, 'utf-8');
    const localResources = gatherLocalResources(body);

    const fileName = 'hexlet-io-courses.html';
    const hostname = 'https://hexlet.io';
    const pathname = '/courses';
    nock(hostname).get(pathname).reply(200, body);

    await loadPage(dir, 'https://hexlet.io/courses');
    const data = await fs.readFile(path.join(dir, fileName), 'utf-8');
    const editedData = editSourceLinks(data, localResources, resourcesFolderName);
    expect(data).toBe(editedData);
  });

  test('test 2', async () => {
    testLog('initiating test 2');
    const testFilePath = path.join(__dirname, '__fixtures__/html/test2.html');
    const resourcesFolderName = path.join(dir, 'hexlet-io-courses_files');
    const body = await fs.readFile(testFilePath, 'utf-8');
    const localResources = gatherLocalResources(body);

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

    const editedBody = editSourceLinks(body, localResources, resourcesFolderName);
    expect(data).toBe(editedBody);
  });
});

describe('additional functions testing', () => {
  test('gather local resources', async () => {
    testLog('initiating test of gathering local resources');
    const testFilePath = path.join(__dirname, '__fixtures__/html/test.html');
    const data = await fs.readFile(testFilePath, 'utf-8');
    const localResources = gatherLocalResources(data);
    const localResoursesValues = flatten(Object.values(localResources));
    expect(localResoursesValues.length).toBe(4);
  });
});
