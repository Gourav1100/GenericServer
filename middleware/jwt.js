const jwt = require("jwt-decode");

/**
 * Middleware function that handles JWT tokens for the specified request object.
 * @param {Object} request - The request object.
 * @returns {Object} - The updated request object.
 */
function JWTMiddleware(request) {
    // Initialize the jwt property of the middleware object with an error array and a null decodedToken
    request.middleware.jwt = { error: [], decodedToken: null };
    // Get the JWT token from the request headers, query parameters, or cookies
    const token = request.headers.authorization;

    if (!token) {
        // If the token is missing, handle the error or deny access
        request.middleware.jwt.error.push("Missing token");
        return false;
    }

    try {
        // Verify and decode the JWT token
        const decodedToken = jwt.verify(token, process.env.secret_key_jwt);
        // Optionally, you can attach the decoded token to the request object for further use
        request.middleware.jwt.decodedToken = decodedToken;
    } catch (error) {
        // If the token is invalid or expired, handle the error or deny access
        request.middleware.jwt.error.push("Invalid token");
        return false;
    }
    return true;
}

module.exports = JWTMiddleware;
