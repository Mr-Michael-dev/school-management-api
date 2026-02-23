module.exports = ({ meta, config, managers }) => {
    return ({ req, res, next, results }) => {
        const token = results['__token'];
        if (!token || token.role !== 'school_admin') {
            return managers.responseDispatcher.dispatch(res, {
                ok: false, code: 403, errors: 'forbidden: school_admin access required'
            });
        }
        next(token);
    };
};
