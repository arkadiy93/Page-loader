import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import url from 'url';
import _ from 'lodash/fp';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';

const log = debug('page-loader');
const axiosLog = debug('page-loader:axios');
const fsLog = debug('page-loader:file-system');

const getRequest = (resourceType) => {
  const requests = {
    img: (resourceUrl, resourcePath) => axios({ method: 'get', url: resourceUrl, responseType: 'stream' })
      .then(({ data }) => {
        axiosLog('resource %s download complete', resourceUrl);
        data.pipe(createWriteStream(resourcePath));

        return data.on('end', () => {
          fsLog('Image was saved to %s', resourcePath);
          return Promise.resolve();
        });
      })
      .catch((err) => {
        axiosLog('Error while downloading resourses file', err);
        throw err;
      }),
    default: (resourceUrl, resourcePath) => axios.get(resourceUrl)
      .then(({ data }) => {
        axiosLog('resource %s download complete', resourceUrl);
        fsLog('save html data to dir %s', resourcePath);
        return data;
      })
      .then(data => fs.writeFile(resourcePath, data))
      .catch((err) => {
        axiosLog('Error while downloading resourses file', err);
        throw err;
      }),
  };

  return requests[resourceType] || requests.default;
};
const getAttribute = (tagName) => {
  const attributes = {
    img: 'src',
    link: 'href',
    script: 'src',
  };
  return attributes[tagName];
};


const editResourceName = (filePath) => {
  const { name, ext } = path.parse(filePath);
  const kebabName = _.kebabCase(name);
  return `${kebabName}${ext}`;
};

export const editSourceLinks = (data, localResources, resourcesFolderName) => {
  const $ = cheerio.load(data);
  const localResourcesValues = localResources.map(({ value }) => value);
  $('img, link, script').each((i, el) => {
    const attribute = getAttribute($(el).get(0).tagName);
    const attributeValue = $(el).attr(attribute);
    if (localResourcesValues.includes(attributeValue)) {
      $(el).attr(attribute, path.join(resourcesFolderName, editResourceName(attributeValue)));
    }
  });
  return $.html();
};

const createHtmlName = (link) => {
  const { hostname, pathname } = url.parse(link);
  return `${_.kebabCase(path.join(hostname, pathname))}.html`;
};

export const createResourcesFolderName = (dir, link) => {
  const { hostname, pathname } = url.parse(link);
  const folderName = `${_.kebabCase(path.join(hostname, pathname))}_files`;
  return path.join(dir, folderName);
};

export const gatherLocalResources = (data) => {
  const $ = cheerio.load(data);
  let localResources = [];
  $('img, link, script').each((i, el) => {
    const attribute = getAttribute($(el).get(0).tagName);
    const attributeValue = $(el).attr(attribute);
    if (attributeValue && !url.parse(attributeValue).protocol) {
      localResources = [
        ...localResources,
        {
          type: $(el).get(0).tagName,
          value: attributeValue,
        },
      ];
    }
  });
  return localResources;
};

export default (dir, link) => {
  const htmlName = createHtmlName(link);
  const resourcesFolderName = createResourcesFolderName(dir, link);
  let localResources;
  return axios.get(link)
    .then(({ data }) => {
      axiosLog('Complete download main html data %s', link);
      fsLog('save html data to dir %s', path.join(dir, htmlName));
      localResources = gatherLocalResources(data);
      const editedData = editSourceLinks(data, localResources, resourcesFolderName);
      return editedData;
    })
    .then(data => fs.writeFile(path.join(dir, htmlName), data))
    .then(() => fsLog('create resource folder %s', resourcesFolderName))
    .then(() => fs.mkdir(resourcesFolderName))
    .then(() => {
      const tasks = localResources.map((resource) => {
        const resourcePath = path.join(resourcesFolderName, editResourceName(resource.value));
        const resourceUrl = url.resolve(link, resource.value);
        const request = getRequest(resource.type);
        return {
          title: url.resolve(link, resource.value),
          task: () => request(resourceUrl, resourcePath),
        };
      });
      const taskList = new Listr(tasks, { concurrent: true });
      return taskList.run();
    })
    .then(() => {
      log('additional resources download and save complete');
      return htmlName;
    })
    .catch((err) => {
      axiosLog('Error while downloading and saving main html file', err);
      throw err;
    });
};
