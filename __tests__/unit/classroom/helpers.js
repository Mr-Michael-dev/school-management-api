'use strict';

const ClassroomManager = require('../../../managers/entities/classroom/Classroom.manager');

function makeMockClassroom(overrides = {}) {
    const base = {
        _id:       'classroom-id-123',
        name:      'Grade 5 - Section A',
        school:    { toString: () => 'school-id-123' },
        capacity:  30,
        resources: ['projector'],
        updatedAt: null,
        save: jest.fn().mockResolvedValue(undefined),
    };
    return { ...base, ...overrides };
}

function buildManager() {
    const validators = {
        classroom: {
            createClassroom: jest.fn().mockResolvedValue(undefined),
            getClassroom:    jest.fn().mockResolvedValue(undefined),
            updateClassroom: jest.fn().mockResolvedValue(undefined),
            deleteClassroom: jest.fn().mockResolvedValue(undefined),
        },
    };

    const mongomodels = {
        Classroom: {
            create:            jest.fn(),
            findById:          jest.fn(),
            find:              jest.fn(),
            findByIdAndDelete: jest.fn(),
        },
        Student: { countDocuments: jest.fn() },
    };

    const manager = new ClassroomManager({ config: {}, validators, mongomodels, managers: {} });
    return { manager, validators, mongomodels };
}

module.exports = { makeMockClassroom, buildManager };
