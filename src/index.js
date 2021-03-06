const log = message => {
  console.log(
    `%c[Router]%c ${message}`,
    'color: rgb(255, 105, 100);',
    'color: inherit'
  );
};

/**
 * Client side router with hash history
 */
export default class Router {
  /**
   * Create a new instance of a client side router
   * @param {Object} options Router options
   * @param {boolean} [options.debug=false] - Enable debugging console messages
   * @param {Object} [options.context=window] - Context to listen for changes on
   * @param {boolean} [options.startListening=true] - Initiate listen on construct
   */
  constructor(options) {
    this.options = Object.assign(
      {
        debug: false,
        context: window,
        startListening: true
      },
      options
    );

    this.isListening = false;
    this.routes = [];
    this.onHashChange = this.check.bind(this);

    if (this.options.startListening) {
      this.listen();
    }
  }

  /**
   * Add a new route
   * @param {string|RegExp} route - Name of route to match
   * @param {function} handler - Method to execute when route matches
   * @returns {Router} - This router instance
   */
  add(route, handler) {
    let newRoute = Router.cleanPath(route);

    if (typeof route === 'function') {
      handler = route;
      newRoute = '';
    }

    newRoute = new RegExp(newRoute);

    this.routes = this.routes.concat({
      route: newRoute,
      handler
    });

    return this;
  }

  /**
   * Remove a route from the router
   * @param {string|RegExp} route - Name of route to remove
   * @param {function} [handler] - Function handler to remove
   * @returns {Router} - This router instance
   */
  remove(route, handler) {
    const routeName = String(new RegExp(route));

    this.routes = this.routes.filter(
      activeRoute =>
        String(new RegExp(activeRoute.route)) !== routeName ||
        (handler ? activeRoute.handler !== handler : false)
    );

    return this;
  }

  /**
   * Reload the current route
   * @returns {Router} - This router instance
   */
  reload() {
    return this.check();
  }

  /**
   * Recheck the path and reload the page
   * @returns {Router} - This router instance
   */
  check() {
    const hash = this.currentRoute;

    for (let route of this.routes) {
      const match = hash.match(route.route);

      if (match !== null && match[0] === hash) {
        match.shift();
        route.handler.apply({}, match);

        if (this.options.debug) {
          log(`Fetching: /${hash}`);
        }

        return this;
      }
    }

    this.navigateError(hash);
    return this;
  }

  /**
   * Start listening for hash changes on the window
   * @param {any} [instance=Window] - Context to start listening on
   * @returns {Router} - This router instance
   */
  listen(instance) {
    this.check();

    if (!this.isListening) {
      (instance || this.options.context || window).addEventListener(
        'hashchange',
        this.onHashChange
      );

      this.isListening = true;
    }

    return this;
  }

  /**
   * Stop listening for hash changes on the window
   * @param {any} [instance=Window] - Context to stop listening on
   * @returns {Router} - This router instance
   */
  stopListen(instance) {
    if (this.isListening) {
      (instance || this.options.context || window).removeEventListener(
        'hashchange',
        this.onHashChange
      );

      this.isListening = false;
    }

    return this;
  }

  /**
   * Navigate router to path
   * @param {string} path - Path to navigate the router to
   * @returns {Router} - This router instance
   */
  navigate(path) {
    if (this.options.debug) {
      log(`Redirecting to: /${Router.cleanPath(path || '')}`);
    }

    history.pushState(null, null, '#/' + Router.cleanPath(path || ''));

    return this;
  }

  /**
   * Navigate to the error page
   * @param {string} hash
   * @returns {Router} - This router instance
   */
  navigateError(hash) {
    if (this.options.debug) {
      log(`Fetching: /${hash}, not a valid route.`);
    }

    this.navigate('error');

    return this;
  }

  /**
   * Name of the current route
   * @returns {string} - Current route
   */
  get currentRoute() {
    return Router.cleanPath(window.location.hash);
  }

  /**
   * Strip the path of slashes and hashes
   * @param {string} path - Path to clean of hashes
   * @returns {string} - Cleaned path
   */
  static cleanPath(path) {
    if (!path) {
      return '';
    }

    return path.toString().replace(/^#+\/+|^\/+#+|^\/+|^#+|\/+$|\?(.*)$/g, '');
  }
}
