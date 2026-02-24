// Swagger configuration for API documentation
const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'School Management API',
            version: '1.0.0',
            description: 'RESTful API for managing schools, classrooms, and students with role-based access control.',
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Development server' },
            { url: 'https://school-manager-api.michaeloyedepo.dev', description: 'Production server' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token from POST /api/user/login',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./managers/entities/**/*.manager.js'],
};

module.exports = swaggerJsDoc(options);
