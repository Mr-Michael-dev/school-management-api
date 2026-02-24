'use strict';

const UserManager = require('../../../managers/entities/user/User.manager');

/**
 * Creates a mock Mongoose user document with jest-spied instance methods.
 * Call makeMockUser({ role: 'superadmin' }) etc. to override defaults.
 */
function makeMockUser(overrides = {}) {
    const base = {
        _id:             'user-id-123',
        username:        'testuser',
        email:           'test@school.com',
        password:        'hashedpassword',
        role:            'school_admin',
        school:          'school-id-123',
        comparePassword: jest.fn().mockResolvedValue(true),
        save:            jest.fn().mockResolvedValue(undefined),
        toObject:        jest.fn(),
    };

    const user = { ...base, ...overrides };

    // toObject() returns a plain copy — mirrors what Mongoose does
    user.toObject.mockReturnValue({
        _id:      user._id,
        username: user.username,
        email:    user.email,
        role:     user.role,
        school:   user.school,
        password: user.password,
    });

    return user;
}

/**
 * Builds a UserManager instance with fully-mocked dependencies.
 * Returns { manager, validators, mongomodels, tokenManager } for fine-grained assertions.
 */
function buildManager() {
    const validators = {
        user: {
            login:          jest.fn().mockResolvedValue(undefined),
            createUser:     jest.fn().mockResolvedValue(undefined),
            getUser:        jest.fn().mockResolvedValue(undefined),
            updateUser:     jest.fn().mockResolvedValue(undefined),
            updatePassword: jest.fn().mockResolvedValue(undefined),
            resetPassword:  jest.fn().mockResolvedValue(undefined),
            deleteUser:     jest.fn().mockResolvedValue(undefined),
        },
    };

    const mongomodels = {
        User: {
            findOne:           jest.fn(),
            findById:          jest.fn(),
            find:              jest.fn(),
            create:            jest.fn(),
            findByIdAndDelete: jest.fn(),
        },
        School: {
            findById:          jest.fn(),
            findByIdAndUpdate: jest.fn(),
        },
    };

    const tokenManager = {
        genLongToken: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const manager = new UserManager({
        config:      {},
        validators,
        mongomodels,
        managers: { token: tokenManager },
    });

    return { manager, validators, mongomodels, tokenManager };
}

module.exports = { makeMockUser, buildManager };
