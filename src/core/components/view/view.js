import $ from '../../shared/dom7.js';
import { extend } from '../../shared/utils.js';
import View from './view-class.js';

function getCurrentView(app) {
  const $popoverView = $('.popover.modal-in .view');
  const $popupView = $('.popup.modal-in .view');
  const $panelView = $('.panel.panel-in .view');
  let $viewsEl = $('.views');
  if ($viewsEl.length === 0) $viewsEl = app.$el;
  // Find active view as tab
  let $viewEl = $viewsEl.children('.view');
  if ($viewEl.length === 0) {
    $viewEl = $viewsEl.children('.tabs').children('.view');
  }
  // Propably in tabs or split view
  if ($viewEl.length > 1) {
    if ($viewEl.hasClass('tab')) {
      // Tabs
      $viewEl = $viewsEl.children('.view.tab-active');
      if ($viewEl.length === 0) {
        $viewEl = $viewsEl.children('.tabs').children('.view.tab-active');
      }
    } else {
      // Split View, leave appView intact
    }
  }
  if ($popoverView.length > 0 && $popoverView[0].f7View) return $popoverView[0].f7View;
  if ($popupView.length > 0 && $popupView[0].f7View) return $popupView[0].f7View;
  if ($panelView.length > 0 && $panelView[0].f7View) return $panelView[0].f7View;
  if ($viewEl.length > 0) {
    if ($viewEl.length === 1 && $viewEl[0].f7View) return $viewEl[0].f7View;
    if ($viewEl.length > 1) {
      return app.views.main;
    }
  }
  return undefined;
}

export default {
  name: 'view',
  params: {
    view: {
      init: true,
      initRouterOnTabShow: false,
      name: undefined,
      main: false,
      router: true,
      linksView: null,
      xhrCache: true,
      xhrCacheIgnore: [],
      xhrCacheIgnoreGetParameters: false,
      xhrCacheDuration: 1000 * 60 * 10, // Ten minutes
      componentCache: true,
      preloadPreviousPage: true,
      allowDuplicateUrls: false,
      reloadPages: false,
      reloadDetail: false,
      masterDetailBreakpoint: 0,
      masterDetailResizable: false,
      removeElements: true,
      removeElementsWithTimeout: false,
      removeElementsTimeout: 0,
      restoreScrollTopOnBack: true,
      unloadTabContent: true,
      passRouteQueryToRequest: true,
      passRouteParamsToRequest: false,
      loadInitialPage: true,
      // Swipe Back
      iosSwipeBack: true,
      iosSwipeBackAnimateShadow: true,
      iosSwipeBackAnimateOpacity: true,
      iosSwipeBackActiveArea: 30,
      iosSwipeBackThreshold: 0,
      mdSwipeBack: false,
      mdSwipeBackAnimateShadow: true,
      mdSwipeBackAnimateOpacity: false,
      mdSwipeBackActiveArea: 30,
      mdSwipeBackThreshold: 0,
      auroraSwipeBack: false,
      auroraSwipeBackAnimateShadow: false,
      auroraSwipeBackAnimateOpacity: true,
      auroraSwipeBackActiveArea: 30,
      auroraSwipeBackThreshold: 0,
      // Push State
      browserHistory: false,
      browserHistoryRoot: undefined,
      browserHistoryAnimate: true,
      browserHistoryAnimateOnLoad: false,
      browserHistorySeparator: '#!',
      browserHistoryOnLoad: true,
      browserHistoryInitialMatch: false,
      browserHistoryStoreHistory: true,
      browserHistoryTabs: 'replace',
      // Animate Pages
      animate: true,
      // iOS Dynamic Navbar
      iosDynamicNavbar: true,
      // Animate iOS Navbar Back Icon
      iosAnimateNavbarBackIcon: true,
      // Delays
      iosPageLoadDelay: 0,
      mdPageLoadDelay: 0,
      auroraPageLoadDelay: 0,
      // Routes hooks
      routesBeforeEnter: null,
      routesBeforeLeave: null,
    },
  },
  static: {
    View,
  },
  create() {
    const app = this;
    extend(app, {
      views: extend([], {
        create(el, params) {
          return new View(app, el, params);
        },
        get(viewEl) {
          const $viewEl = $(viewEl);
          if ($viewEl.length && $viewEl[0].f7View) return $viewEl[0].f7View;
          return undefined;
        },
      }),
    });
    Object.defineProperty(app.views, 'current', {
      enumerable: true,
      configurable: true,
      get() {
        return getCurrentView(app);
      },
    });
    // Alias
    app.view = app.views;
  },
  on: {
    init() {
      const app = this;
      $('.view-init').each((viewEl) => {
        if (viewEl.f7View) return;
        const viewParams = $(viewEl).dataset();
        app.views.create(viewEl, viewParams);
      });
    },
    'modalOpen panelOpen': function onOpen(instance) {
      const app = this;
      instance.$el.find('.view-init').each((viewEl) => {
        if (viewEl.f7View) return;
        const viewParams = $(viewEl).dataset();
        app.views.create(viewEl, viewParams);
      });
    },
    'modalBeforeDestroy panelBeforeDestroy': function onClose(instance) {
      if (!instance || !instance.$el) return;
      instance.$el.find('.view-init').each((viewEl) => {
        const view = viewEl.f7View;
        if (!view) return;
        view.destroy();
      });
    },
  },
  vnode: {
    'view-init': {
      insert(vnode) {
        const app = this;
        const viewEl = vnode.elm;
        if (viewEl.f7View) return;
        const viewParams = $(viewEl).dataset();
        app.views.create(viewEl, viewParams);
      },
      destroy(vnode) {
        const viewEl = vnode.elm;
        const view = viewEl.f7View;
        if (!view) return;
        view.destroy();
      },
    },
  },
};
