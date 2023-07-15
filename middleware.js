class MiddleWare {
    request = null;
    middlewareList = [];
    excludeList = [];
    /**
     * Constructs a new instance of the MiddleWare class.
     * @param {Object} request - The request object.
     */
    constructor(request) {
        this.request = request;
        this.request.middleware = { pass: true };
    }

    /**
     * Inserts middleware into the middlewareList array.
     * @param {Function} middleware - The middleware function to be inserted.
     * @returns {Number|null|undefined} - Returns the index of the inserted middleware, null if the middleware already exists, and undefined if no request is provided.
     */
    insertMiddleware(middleware) {
        if (!request) {
            return undefined;
        }
        if (this.middlewareList.indexOf(middleware) === -1) {
            this.middlewareList.push(middleware);
            return this.middlewareList.indexOf(middleware);
        }
        return null;
    }

    /**
     * Loads middleware from the specified path and adds it to the middlewareList array.
     * @param {String} middlewarePath - The path to the middleware file.
     */
    loadMiddleware(middlewarePath) {
        delete require.cache[require.resolve(`./middleware/${middlewarePath}`)];
        this.middlewareList.push(require(`./middleware/${middlewarePath}`));
    }

    /**
     * Runs all middleware functions in the middlewareList array.
     */
    run() {
        this.middlewareList.forEach((middleware) => {
            // Get a copy of the request object
            const didPass = middleware(this.request);
            console.log(`${middleware.name}: ${didPass}`);
            // Update the pass property of the middleware object
            this.request.middleware.pass = this.request.middleware.pass & didPass;
        });
        if (this.excludeList.indexOf(this.request.url) !== -1) {
            this.request.middleware.pass = true;
        }
    }

    /**
     * Adds a path to the exclude list if it is not already present
     * @param {string} path - The path to exclude
     * @returns {number|null|undefined} - The index of the path in the exclude list, null if the path is already in the exclude list, undefined if `this.request` is falsy
     */
    insertExcludePath(path) {
        // If there is no request, return undefined
        if (!this.request) {
            return undefined;
        }

        // If the path is not already in the exclude list, add it and return its index
        if (this.excludeList.indexOf(path) === -1) {
            this.excludeList.push(path);
            return this.excludeList.indexOf(path);
        }

        // If the path is already in the exclude list, return null
        return null;
    }
}

/**
 * Handles middleware for the specified request object.
 * @param {Object} request - The request object.
 * @returns {Object} - The updated request object.
 */
async function handleMiddleware(request) {
    const middleware = new MiddleWare(request);
    // middleware.insertExcludePath("/api/hello");
    middleware.loadMiddleware("jwt");
    middleware.run();
    return middleware.request;
}

module.exports = handleMiddleware;
