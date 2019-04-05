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

const getRequest = (resourceType) => {
  const requests = {
    img: (resourceUrl, resourcePath) => axios({ method: 'get', url: resourceUrl, responseType: 'stream' })
      .then(({ data }) => {
        data.pipe(createWriteStream(resourcePath));

        return data.on('end', () => Promise.resolve());
      })
      .catch((err) => {
        axiosLog('Error while downloading resourses file', err);
        throw err;
      }),
    script: (resourceUrl, resourcePath) => axios.get(resourceUrl)
      .then(({ data }) => fs.writeFile(resourcePath, data))
      .catch((err) => {
        axiosLog('Error while downloading resourses file', err);
        throw err;
      }),
    link: (resourceUrl, resourcePath) => axios.get(resourceUrl)
      .then(({ data }) => fs.writeFile(resourcePath, data))
      .catch((err) => {
        axiosLog('Error while downloading resourses file', err);
        throw err;
      }),
  };
  return requests[resourceType];
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
  const localResourcesValues = _.flatten(Object.values(localResources));
  $('img, link, script').each((i, el) => {
    const { tagName } = $(el).get(0);
    const attribute = getAttribute(tagName);
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
  const localResources = { link: [], script: [], img: [] };
  $('img, link, script').each((i, el) => {
    const { tagName } = $(el).get(0);
    const attribute = getAttribute(tagName);
    const attributeValue = $(el).attr(attribute);
    if (attributeValue && !url.parse(attributeValue).protocol) {
      localResources[tagName] = [...localResources[tagName], attributeValue];
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
      log('main html data download complete');
      localResources = gatherLocalResources(data);
      const editedData = editSourceLinks(data, localResources, resourcesFolderName);
      return editedData;
    })
    .then(data => fs.writeFile(path.join(dir, htmlName), data))
    .then(() => log('main html file saved'))
    .then(() => fs.mkdir(resourcesFolderName))
    .then(() => log('create resource folder'))
    .then(() => {
      const tasks = Object.keys(localResources)
        .map(resourceType => localResources[resourceType].map((resourceName) => {
          const resourcePath = path.join(resourcesFolderName, editResourceName(resourceName));
          const resourceUrl = url.resolve(link, resourceName);
          const request = getRequest(resourceType);
          return {
            title: url.resolve(link, resourceName),
            task: () => request(resourceUrl, resourcePath),
          };
        }));
      const taskList = new Listr(_.flatten(tasks), { concurrent: true });
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
