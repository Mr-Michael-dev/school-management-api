'use strict';

const { makeMockClassroom, buildManager } = require('./helpers');

describe('ClassroomManager.createClassroom', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['name is required'] };
        validators.classroom.createClassroom.mockResolvedValue(validationError);

        const result = await manager.createClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, name: '',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.Classroom.create).not.toHaveBeenCalled();
    });

    it('returns error when capacity is zero', async () => {
        const result = await manager.createClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            name: 'Grade 5', capacity: 0,
        });

        expect(result).toEqual({ error: 'capacity must be a positive integer' });
        expect(mongomodels.Classroom.create).not.toHaveBeenCalled();
    });

    it('returns error when capacity is a negative number', async () => {
        const result = await manager.createClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            name: 'Grade 5', capacity: -5,
        });

        expect(result).toEqual({ error: 'capacity must be a positive integer' });
    });

    it('returns error when capacity is a non-integer', async () => {
        const result = await manager.createClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            name: 'Grade 5', capacity: 1.5,
        });

        expect(result).toEqual({ error: 'capacity must be a positive integer' });
    });

    it('returns error when admin has no school assigned', async () => {
        const result = await manager.createClassroom({
            __token: { school: null }, __schoolAdmin: true, name: 'Grade 5',
        });

        expect(result).toEqual({ error: 'Admin is not assigned to any school' });
        expect(mongomodels.Classroom.create).not.toHaveBeenCalled();
    });

    it('creates classroom with school from token', async () => {
        const mockClassroom = makeMockClassroom();
        mongomodels.Classroom.create.mockResolvedValue(mockClassroom);

        const result = await manager.createClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            name: 'Grade 5 - Section A', capacity: 30, resources: ['projector'],
        });

        expect(mongomodels.Classroom.create).toHaveBeenCalledWith({
            name: 'Grade 5 - Section A',
            school: 'school-id-123',
            capacity: 30,
            resources: ['projector'],
        });
        expect(result).toEqual({ classroom: mockClassroom });
    });

    it('defaults capacity to null and resources to [] when not provided', async () => {
        const mockClassroom = makeMockClassroom({ capacity: null, resources: [] });
        mongomodels.Classroom.create.mockResolvedValue(mockClassroom);

        await manager.createClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            name: 'Grade 5 - Section A',
        });

        expect(mongomodels.Classroom.create).toHaveBeenCalledWith({
            name: 'Grade 5 - Section A',
            school: 'school-id-123',
            capacity: null,
            resources: [],
        });
    });
});
