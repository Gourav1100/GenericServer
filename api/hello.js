/**
 * Handles the request and returns a response object.
 * @param {Object} req - The request object.
 * @returns {Object} - The response object.
 */
async function requestHandler(req) {
    // Check if there are any errors in the JWT middleware object
    if (req.middleware.jwt.error) {
        console.log("Unauthorized Access !");
        // If there are errors, return an unauthorized response object
        return {
            status: 401,
            success: false,
            message: "API endpoint unauthorized.",
        };
    }
    // If there are no errors, return a success response object
    console.log("API endpoint is working");
    return {
        status: 200,
        success: true,
        message: "API endpoint is working.",
    };
}

module.exports = requestHandler;
