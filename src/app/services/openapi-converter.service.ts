import { Injectable } from '@angular/core';
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { RemoveLeadingSlash } from 'src/app/libs/utils.lib';
import { Environment } from 'src/app/types/environment.type';
import { methods, Route, RouteResponse, statusCodes } from 'src/app/types/route.type';
import * as SwaggerParser from 'swagger-parser';
import * as uuid from 'uuid/v1';


/**
 * WIP
 *
 * TODO:
 * - get response specific headers DONE
 * - get multiple responses WIP
 * - example body ? from first response in array ()
 * - create mock objects from entities definition
 * - test/adapt for v3
 * - better handling of variable (find in paramter object and really replace)
 * - add route response description in futur label
 *
 * FIX
 * bug when too much route (pushing footer)
 *
 * insomnia example: https://github.com/getinsomnia/insomnia/blob/8a751883f893437c5228eb266f3ec3a58e4a53c8/packages/insomnia-importers/src/importers/swagger2.js#L1-L18
 *
 */


@Injectable()
export class OpenAPIConverterService {

  constructor() { }

  public async import(filePath: string) {
    const parsedDefinition: OpenAPIV2.Document | OpenAPIV3.Document = await SwaggerParser.parse(filePath);

    console.log(parsedDefinition)

    if (parsedDefinition['swagger'] && parsedDefinition['swagger'] === '2.0') {
      return this.convertV2Format(parsedDefinition as OpenAPIV2.Document);
    } else if (parsedDefinition['openapi'] && parsedDefinition['openapi'] === '3.0.0') {
      return this.convertV3Format(parsedDefinition as OpenAPIV3.Document);
    } else {
      // TODO add error toast
      return;
    }
  }

  /**
   * Convert Swagger 2.0 format
   * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md
   *
   * @param parsedDefinition
   */
  private convertV2Format(parsedDefinition: OpenAPIV2.Document): Environment {

    const newenv: Environment = {
      uuid: uuid(),
      name: parsedDefinition.info.title || '',
      endpointPrefix: RemoveLeadingSlash(parsedDefinition.basePath),
      latency: 0,
      port: 3000,
      routes: [],
      proxyMode: false,
      proxyHost: '',
      https: false,
      cors: true,
      headers: []
    };

    Object.keys(parsedDefinition.paths).forEach((routePath) => {
      Object.keys(parsedDefinition.paths[routePath]).forEach((routeMethod) => {
        const parsedRoute: OpenAPIV2.OperationObject = parsedDefinition.paths[routePath][routeMethod];
        if (methods.includes(routeMethod) && routeMethod !== 'parameters') {
          const routeContentTypeHeader = { key: 'Content-Type', value: 'application/json' };

          if (parsedRoute.produces && !parsedRoute.produces.includes('application/json')) {
            routeContentTypeHeader.value = parsedRoute.produces[0];
          }

          const routeResponses: RouteResponse[] = [];
          Object.keys(parsedRoute.responses).forEach(responseStatus => {
            // filter unsupported status codes (i.e. ranges 5XX)
            if (statusCodes.find(statusCode => statusCode.code.toString() === responseStatus) || responseStatus === 'default') {
              let responseHeaders = [routeContentTypeHeader];
              if (parsedRoute.responses[responseStatus].headers) {
                responseHeaders = [routeContentTypeHeader, ...Object.keys((parsedRoute.responses[responseStatus] as OpenAPIV2.ResponseObject).headers).map(header => ({ key: header, value: '' }))];
              }

              routeResponses.push({
                uuid: uuid(),
                rules: [],
                body: '{}',
                latency: 0,
                statusCode: (responseStatus === 'default') ? '200' : responseStatus.toString(),
                headers: responseHeaders,
                filePath: null,
                sendFileAsBody: false
              });
            }
          });

          // check if has at least one 200
          if (!routeResponses.find(response => response.statusCode === '200')) {
            routeResponses.unshift({
              uuid: uuid(),
              rules: [],
              body: '{}',
              latency: 0,
              statusCode: '200',
              headers: [{ key: 'Content-Type', value: 'application/json' }],
              filePath: null,
              sendFileAsBody: false
            });
          }

          const newRoute: Route = {
            uuid: uuid(),
            documentation: parsedRoute.summary || parsedRoute.description || '',
            method: routeMethod as any,
            endpoint: RemoveLeadingSlash(this.variableReplace(routePath, true, null)),
            responses: routeResponses
          };

          newenv.routes.push(newRoute);
        }
      });
    });

    return newenv;
  }

  /**
   * Convert OpenAPI 3.0 format
   * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md
   *
   * @param parsedDefinition
   */
  private convertV3Format(parsedDefinition: OpenAPIV3.Document) {

    const newenv: Environment = {
      uuid: uuid(),
      name: parsedDefinition.info.title || '',
      endpointPrefix: '',
      latency: 0,
      port: 3000,
      routes: [],
      proxyMode: false,
      proxyHost: '',
      https: false,
      cors: true,
      headers: []
    };
    /*
        // TODO handle variables in server ?
        const server = parsedDefinition.servers;
        newenv.endpointPrefix = server && server[0] && server[0].url && RemoveLeadingSlash(url.parse(this.openAPIVariableReplace(server[0].url, false, server[0])).path);

        Object.keys(parsedDefinition.paths).forEach((routePath) => {
          Object.keys(parsedDefinition.paths[routePath]).forEach((routeMethod) => {
            const parsedRoute = parsedDefinition.paths[routePath][routeMethod];
            // TODO check if route method exists in mockoon (swagger also has TRACE)
            if (routeMethod) {
              // WIP get headers from "headers" or "produces"
              const headers = (parsedRoute.headers) ? Object.keys(parsedRoute.headers).map((header) => ({ uuid: 'TODO', key: header, value: '' })) : parsedRoute.produces && parsedRoute.produces[0];

              const newRoute: Route = {
                uuid: uuid(),
                documentation: parsedRoute.summary || parsedRoute.description || '',
                method: routeMethod as any,
                endpoint: RemoveLeadingSlash(this.openAPIVariableReplace(routePath, true, null)),
                // TODO use route responses
                responses: [{
                  uuid: uuid(),
                  rules: [],
                  body: '{}',
                  latency: 0,
                  statusCode: '200',
                  headers: [headers || { uuid: '', key: 'Content-Type', value: 'application/json' }],
                  filePath: null,
                  sendFileAsBody: false
                }]

              };

              newenv.routes.push(newRoute);
            }
          });
        }); */

    return newenv;
  }

  private variableReplace(str, pathVariable, obj) {
    return str.replace(/{(\w+)}/ig, (searchValue, replaceValue) => {
      if (pathVariable) {
        return ':' + replaceValue;
      } else {
        return obj.variables[replaceValue].default;
      }
    })
  }
}
