const http              = require('http');
const express           = require('express');
const cors              = require('cors');
const helmet            = require('helmet');
const rateLimit         = require('express-rate-limit');
const swaggerUi         = require('swagger-ui-express');
const swaggerSpec       = require('../../config/swagger');
const app               = express();

/** General API rate limiter: 100 requests per 15 minutes */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, message: 'Too many requests, please try again later.' },
});

/** Strict limiter for auth routes: 10 requests per 15 minutes */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, message: 'Too many authentication attempts, please try again later.' },
});

module.exports = class SchoolServer {
    constructor({config, managers}){
        this.config        = config;
        this.schoolApi       = managers.schoolApi;
    }

    /** for injecting middlewares */
    use(args){
        app.use(args);
    }

    /** server configs */
    run(){
        app.use('/api-docs', (_req, res, next) => {
            // Set strict Content Security Policy for Swagger UI
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
            next();
        }, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        app.use(helmet());
        app.use(cors({origin: '*'}));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true}));
        app.use('/static', express.static('public'));

        /** Apply auth rate limiter to login and register endpoints */
        app.use('/api/user/login', authLimiter);
        app.use('/api/user/createUser', authLimiter);

        /** Apply general rate limiter to all API routes */
        app.use('/api/', generalLimiter);

        /** a single middleware to handle all */
        app.all('/api/:moduleName/:fnName', this.schoolApi.mw);

        /** an error handler */
        app.use((err, _req, res, _next) => {
            console.error(err.stack);
            if (err.type === 'entity.parse.failed') {
                return res.status(400).json({ ok: false, data: {}, errors: [], message: 'Invalid JSON in request body' });
            }
            res.status(500).json({ ok: false, data: {}, errors: [], message: 'Internal server error' });
        });

        let server = http.createServer(app);
        server.listen(this.config.dotEnv.USER_PORT, () => {
            console.log(`${(this.config.dotEnv.SERVICE_NAME).toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`);
        });
    }
}