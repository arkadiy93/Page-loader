import axios from 'axios';
import { promises as fs } from 'fs';
import url from 'url';
import _ from 'lodash/fp';
import path from 'path';
import cheerio from 'cheerio';

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
  const localResourcesValues = localResources.map(el => Object.keys(el)[0]);
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
  return $('img, link, script').filter((i, el) => {
    const { tagName } = $(el).get(0);
    const attribute = getAttribute(tagName);
    return $(el).attr(attribute);
  }).map((i, el) => {
    const { tagName } = $(el).get(0);
    const attribute = getAttribute(tagName);
    const attributeValue = $(el).attr(attribute);
    return { [attributeValue]: tagName };
  }).filter((i, el) => {
    const [attributeValue] = Object.keys(el);
    const { protocol } = url.parse(attributeValue);
    return !protocol;
  })
    .get();
};

export default (dir, link) => {
  const htmlName = createHtmlName(link);
  const resourcesFolderName = createResourcesFolderName(dir, link);
  let localResources;
  return axios.get(link)
    .then(({ data }) => {
      localResources = gatherLocalResources(data);
      const editedData = editSourceLinks(data, localResources, resourcesFolderName);
      return editedData;
    })
    .then(data => fs.writeFile(path.join(dir, htmlName), data))
    .then(() => fs.mkdir(resourcesFolderName))
    .then(() => {
      const promises = localResources.map((resourceData) => {
        const [resourceName] = Object.keys(resourceData);
        const resourceType = resourceData.resourceName;
        const resourcePath = path.join(resourcesFolderName, editResourceName(resourceName));
        const myUrl = new URL(link);
        myUrl.pathname = resourceName;

        if (resourceType === 'img') {
          return axios({
            method: 'get',
            url: myUrl.href,
            responseType: 'stream',
          }).then(({ data }) => fs.writeFile(resourcePath, data));
        }
        return axios.get(myUrl.href).then(({ data }) => fs.writeFile(resourcePath, data));
      });
      return Promise.all(promises);
    });
};
