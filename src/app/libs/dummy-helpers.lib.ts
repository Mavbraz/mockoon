import { format as dateFormat } from 'date-fns';
import * as DummyJSON from 'dummy-json';
import random from 'lodash/random';
import * as objectPath from 'object-path';
import * as queryString from 'querystring';
import * as xmlJs from 'xml-js';

/**
 * Prevents insertion of Dummy-JSON own object (last argument) when no default value is provided:
 *
 * if (typeof defaultValue === 'object') {
 *   defaultValue = '';
 * }
 *
 * /!\ Do not use () => {} for custom helpers in order to keep DummyJSON `this`
 *
 */
export const DummyJSONHelpers = (request) => {
  return {
    // get json property from body
    body: function (path: string, defaultValue: string) {
      const requestContentType = request.header('Content-Type');

      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      // try to parse body otherwise return defaultValue
      try {
        let value;

        if (requestContentType === 'application/x-www-form-urlencoded') {
          value = queryString.parse(request.body)[path];
        } else {
          const body = /(application|text)\/(.+\+)?xml/.test(requestContentType) ?
            xmlJs.xml2json(request.body, { compact: true }) : request.body;
          const jsonBody = JSON.parse(body);
          value = objectPath.ensureExists(jsonBody, path);
        }

        if (value !== undefined) {
          return value;
        } else {
          return defaultValue;
        }
      } catch (e) {
        return defaultValue;
      }
    },
    // use params from url /:param1/:param2
    urlParam: function (paramName: string) {
      return request.params[paramName];
    },
    // use params from query string ?param1=xxx&param2=yyy
    queryParam: function (paramName: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      return request.query[paramName] || defaultValue;
    },
    // use content from request header
    header: function (headerName: string, defaultValue: string) {
      if (typeof defaultValue === 'object') {
        defaultValue = '';
      }

      return request.get(headerName) || defaultValue;
    },
    // use request hostname
    hostname: function () {
      return request.hostname;
    },
    // use request ip
    ip: function () {
      return request.ip;
    },
    // use request method
    method: function () {
      return request.method;
    },
    // return one random item
    oneOf: function (itemList: string[]) {
      return DummyJSON.utils.randomArrayItem(itemList);
    },
    // return some random item as an array (to be used in triple braces) or as a string
    someOf: function (itemList: string[], min: number, max: number, asArray = false) {
      const randomItems = itemList.sort(() => .5 - Math.random()).slice(0, random(min, max));

      if (asArray === true) {
        return `["${randomItems.join('","')}"]`;
      }

      return randomItems;
    },
    // create an array
    array: function (...args: any[]) {
      // remove last item (dummy json options argument)
      return args.slice(0, args.length - 1);
    },
    // switch cases
    switch: function (value, options) {
      this.found = false;

      this.switchValue = value;
      const htmlContent = options.fn(this);

      return htmlContent;
    },
    // case helper for switch
    case: function (value, options) {
      // check switch value to simulate break
      if (value === this.switchValue && !this.found) {
        this.found = true;

        return options.fn(this);
      }
    },
    // default helper for switch
    default: function (options) {
      // if there is still a switch value show default content
      if (!this.found) {
        delete this.switchValue;

        return options.fn(this);
      }
    },
    // provide current time with format
    now: function (format) {
      return dateFormat(new Date(), (typeof format === 'string') ? format : '');
    }
  };
};

/**
 * Parse a text with DummyJSON
 *
 * @param text
 * @param request
 */
export const DummyJSONParser = (text: string, request: any): string => {
  return DummyJSON.parse(text, { helpers: DummyJSONHelpers(request) });
};
