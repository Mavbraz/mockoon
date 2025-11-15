import environments from '../libs/environments';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import utils, { DropdownMenuRouteActions } from '../libs/utils';

describe('Create and delete routes', () => {
  describe('Basic route creation and deletion', () => {
    it('should open the environment', async () => {
      await environments.open('basic-data');
    });

    it('should add a route and verify the header counter', async () => {
      await routes.assertCount(3);
      await navigation.assertHeaderValue('ENV_ROUTES', 'Routes 3');

      await routes.addHTTPRoute();
      await routes.assertCount(4);
      await navigation.assertHeaderValue('ENV_ROUTES', 'Routes 4');
    });

    it('should remove 3 routes over 4', async () => {
      await routes.remove(1);
      await routes.remove(1);
      await routes.remove(1);
      await routes.assertCount(1);
    });

    it('should display a message when no route is present', async () => {
      await utils.dropdownMenuClick(
        `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
        DropdownMenuRouteActions.DELETE,
        true
      );

      await routes.assertCount(0);
      await navigation.assertHeaderValue('ENV_ROUTES', 'Routes');

      await utils.assertElementText(
        $('.main-content .message'),
        'No route defined'
      );
    });
  });

  describe('Delete route with tab reset from HTTP CALLBACKS to CRUD RESPONSE', () => {
    it('should create a new environment and ', async () => {
      await environments.localAdd('test-env-crud');
      await routes.remove(1);
    });

    it('should add routes', async () => {
      await routes.addCRUDRoute();
      await routes.addHTTPRoute();
      await routes.assertCount(1);
    });

    it('should switch to CALLBACKS tab', async () => {
      await routes.switchTab('CALLBACKS');
      await routes.assertActiveRouteResponseTab('CALLBACKS');
    });

    it('should delete the HTTP route and verify tab is reset to CRUD RESPONSE', async () => {
      await routes.remove(2);
      await routes.assertCount(1);
    });

    it('should verify the CRUD route does not have CALLBACKS tab', async () => {
      await routes.assertActiveRouteResponseTab('RESPONSE');
    });
  });

  // describe('Delete route with tab reset from HTTP CALLBACKS to WebSocket RESPONSE', () => {
  //   it('should create a new environment', async () => {
  //     await environments.localAdd('test-env-websocket');
  //     await routes.addHTTPRoute();
  //     await routes.addHTTPRoute();
  //     await routes.addHTTPRoute();
  //   });

  //   it('should add a WebSocket route', async () => {
  //     await routes.addWebSocketRoute();
  //     await routes.assertCount(4);
  //     await routes.setPath('test-ws');
  //     await routes.assertMenuEntryText(4, '/test-ws\nWS');
  //   });

  //   it('should select first HTTP route and switch to CALLBACKS tab', async () => {
  //     await routes.select(1);
  //     await routes.switchTab('CALLBACKS');
  //     await routes.assertActiveRouteResponseTab('CALLBACKS');
  //   });

  //   it('should delete the HTTP route and verify tab is reset to RESPONSE', async () => {
  //     await utils.dropdownMenuClick(
  //       `.routes-menu .nav-item:nth-child(1) .nav-link`,
  //       DropdownMenuRouteActions.DELETE,
  //       true
  //     );
  //     await routes.assertCount(3);
  //     await browser.pause(500);
  //     await routes.assertActiveRouteResponseTab('RESPONSE');
  //   });

  //   it('should verify the WebSocket route does not have CALLBACKS tab', async () => {
  //     await routes.select(3);
  //     await routes.assertMenuEntryText(3, '/test-ws\nWS');
  //     await routes.assertActiveRouteResponseTab('RESPONSE');
  //     const callbacksTab = await $(
  //       '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(4) .nav-link'
  //     );
  //     expect(await callbacksTab.isExisting()).toEqual(false);
  //   });

  //   it('should verify the WebSocket route does not have HEADERS tab', async () => {
  //     await routes.assertMenuEntryText(3, '/test-ws\nWS');
  //     const headersTab = await $(
  //       '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(2) .nav-link'
  //     );
  //     expect(await headersTab.isExisting()).toEqual(false);
  //   });

  //   it('should verify HTTP route still has CALLBACKS tab', async () => {
  //     await routes.select(1);
  //     await routes.switchTab('CALLBACKS');
  //     await routes.assertActiveRouteResponseTab('CALLBACKS');
  //   });

  //   it('should select WebSocket and verify tab is reset from CALLBACKS', async () => {
  //     await routes.assertActiveRouteResponseTab('CALLBACKS');
  //     await routes.select(3);
  //     await routes.assertMenuEntryText(3, '/test-ws\nWS');
  //     await browser.pause(300);
  //     await routes.assertActiveRouteResponseTab('RESPONSE');
  //   });
  // });
});
