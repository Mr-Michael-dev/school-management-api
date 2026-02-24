'use strict';

const StudentManager = require('../../../managers/entities/student/Student.manager');

function makeMockStudent(overrides = {}) {
    const base = {
        _id:         'student-id-123',
        firstName:   'John',
        lastName:    'Doe',
        email:       'john.doe@student.com',
        dateOfBirth: null,
        school:      { toString: () => 'school-id-123' },
        classroom:   { toString: () => 'classroom-id-123' },
        updatedAt:   null,
        save: jest.fn().mockResolvedValue(undefined),
    };
    return { ...base, ...overrides };
}

function makeMockClassroom(overrides = {}) {
    const base = {
        _id:    'classroom-id-123',
        name:   'Grade 5',
        school: { toString: () => 'school-id-123' },
    };
    return { ...base, ...overrides };
}

function buildManager() {
    const validators = {
        student: {
            enrollStudent:   jest.fn().mockResolvedValue(undefined),
            getStudent:      jest.fn().mockResolvedValue(undefined),
            updateStudent:   jest.fn().mockResolvedValue(undefined),
            transferStudent: jest.fn().mockResolvedValue(undefined),
            removeStudent:   jest.fn().mockResolvedValue(undefined),
        },
    };

    const mongomodels = {
        Student: {
            create:            jest.fn(),
            findById:          jest.fn(),
            find:              jest.fn(),
            findOne:           jest.fn(),
            findByIdAndDelete: jest.fn(),
        },
        Classroom: { findById: jest.fn() },
    };

    const manager = new StudentManager({ config: {}, validators, mongomodels, managers: {} });
    return { manager, validators, mongomodels };
}

module.exports = { makeMockStudent, makeMockClassroom, buildManager };
