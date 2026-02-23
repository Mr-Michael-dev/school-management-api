// I modified this mildeware to extract and verify JWT from Bearer token in Authorization header.
// Verifies long tokens (login tokens) and injects decoded user data into next middleware.
module.exports = ({ meta, config, managers }) => {
    return ({ req, res, next }) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;

        if (!token) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false, code: 401, errors: 'unauthorized'
            });
        }

        const decoded = managers.token.verifyLongToken({ token });
        if (!decoded) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false, code: 401, errors: 'unauthorized'
            });
        }

        // decoded contains: { userId, userKey, role, school }
        next(decoded);
    };
};