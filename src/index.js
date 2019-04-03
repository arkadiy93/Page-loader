import axios from 'axios';
import { promises as fs } from 'fs';
import url from 'url';
import _ from 'lodash/fp';
import path from 'path';
import cheerio from 'cheerio';

const editResourceName = (filePath) => {
  const [dir, ...format] = filePath.split('.');
  const dirDashed = _.kebabCase(dir);
  return [dirDashed, ...format].join('.');
};

export const editSourceLinks = (data, resourcesFolderName) => {
  // under construction

  // console.log(data);
  const $ = cheerio.load(data);
  $('img').each((i, el) => {
    const initSrc = $(el).attr('src');
    $(el).attr('src', path.join(resourcesFolderName, editResourceName(initSrc)));
  });
  $('link').each((i, el) => {
    const initSrc = $(el).attr('src');
    $(el).attr('src', path.join(resourcesFolderName, editResourceName(initSrc)));
  });
  $('script').each((i, el) => {
    const initSrc = $(el).attr('src');
    $(el).attr('src', path.join(resourcesFolderName, editResourceName(initSrc)));
  });
  // return $.html();
  return data;
};

const createHtmlName = (link) => {
  const { hostname, pathname } = url.parse(link);
  return `${_.kebabCase(path.join(hostname, pathname))}.html`;
};

const createResourcesFolderName = (link, dir) => {
  const { hostname, pathname } = url.parse(link);
  const folderName = `${_.kebabCase(path.join(hostname, pathname))}_files`;
  return path.join(dir, folderName);
};

export const gatherLocalResources = (data) => {
  const $ = cheerio.load(data);
  const localImageSources = $('img').filter((i, el) => $(el).attr('src')).map((i, el) => $(el).attr('src'))
    .filter((i, el) => {
      const { protocol } = url.parse(el);
      return !protocol;
    })
    .get();
  const localLinkSources = $('link').filter((i, el) => $(el).attr('src')).map((i, el) => $(el).attr('src'))
    .filter((i, el) => {
      const { protocol } = url.parse(el);
      return !protocol;
    })
    .get();
  const localScriptSources = $('script').filter((i, el) => $(el).attr('src')).map((i, el) => $(el).attr('src'))
    .filter((i, el) => {
      const { protocol } = url.parse(el);
      return !protocol;
    })
    .get();
  return [...localLinkSources, ...localImageSources, ...localScriptSources];
};

export default (dir, link) => {
  const htmlName = createHtmlName(link);
  const resourcesFolderName = createResourcesFolderName(link, dir);
  let localResources;
  return axios.get(link)
    .then(({ data }) => {
      localResources = gatherLocalResources(data);
      const editedData = editSourceLinks(data, resourcesFolderName);
      return editedData;
    })
    .then(data => fs.writeFile(path.join(dir, htmlName), data))
    .then(() => fs.mkdir(resourcesFolderName))
    .then(() => localResources.map((resourceName) => {
      const resourcePath = path.join(resourcesFolderName, editResourceName(resourceName));
      const myUrl = new URL(link);
      myUrl.pathname = resourceName;
      return axios.get(myUrl.href).then(({ data }) => fs.writeFile(resourcePath, data));
    }))
    .then(promises => Promise.all(promises));
};
