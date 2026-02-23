module.exports = class AppStatus { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.managers            = managers;
        this.httpExposed         = ['get=appStatus'];
    }

    async appStatus({ res }){
        this.managers.responseDispatcher.dispatch(res, {
            ok: true,
            message: 'App is running smoothly. All systems operational.',
        });
        return { selfHandleResponse: true };
    }
}
