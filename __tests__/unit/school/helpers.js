'use strict';

const SchoolManager = require('../../../managers/entities/school/School.manager');

function makeMockSchool(overrides = {}) {
    const base = {
        _id:      'school-id-123',
        name:     'Test School',
        address:  '123 Main St',
        admins:   [],
        updatedAt: null,
        save: jest.fn().mockResolvedValue(undefined),
    };
    return { ...base, ...overrides };
}

function makeMockUser(overrides = {}) {
    const base = {
        _id:    'user-id-123',
        username: 'adminuser',
        email:  'admin@school.com',
        role:   'school_admin',
        school: null,
    };
    return { ...base, ...overrides };
}

function buildManager() {
    const validators = {
        school: {
            createSchool: jest.fn().mockResolvedValue(undefined),
            getSchool:    jest.fn().mockResolvedValue(undefined),
            updateSchool: jest.fn().mockResolvedValue(undefined),
            deleteSchool: jest.fn().mockResolvedValue(undefined),
            assignAdmin:  jest.fn().mockResolvedValue(undefined),
            removeAdmin:  jest.fn().mockResolvedValue(undefined),
        },
    };

    const mongomodels = {
        School: {
            create:            jest.fn(),
            findById:          jest.fn(),
            find:              jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
        },
        User: {
            findById:          jest.fn(),
            findByIdAndUpdate: jest.fn(),
            updateMany:        jest.fn(),
        },
        Student:   { deleteMany: jest.fn() },
        Classroom: { deleteMany: jest.fn() },
    };

    const manager = new SchoolManager({ config: {}, validators, mongomodels, managers: {} });
    return { manager, validators, mongomodels };
}

module.exports = { makeMockSchool, makeMockUser, buildManager };
