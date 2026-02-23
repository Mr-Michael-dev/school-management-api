module.exports = ({ meta, config, managers }) => {
    return ({ req, res, next, results }) => {
        const token = results['__token'];

        if (!token || token.role !== 'superadmin') {
            return managers.responseDispatcher.dispatch(res, {
                ok: false, code: 403, errors: 'forbidden: superadmin access required'
            });
        }

        next(token); // passes decoded token forward as __superadmin
    };
};
