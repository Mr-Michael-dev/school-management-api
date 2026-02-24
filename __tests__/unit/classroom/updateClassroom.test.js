'use strict';

const { makeMockClassroom, buildManager } = require('./helpers');

describe('ClassroomManager.updateClassroom', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.classroom.updateClassroom.mockResolvedValue(validationError);

        const result = await manager.updateClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: '',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.Classroom.findById).not.toHaveBeenCalled();
    });

    it('returns error when capacity is invalid', async () => {
        const result = await manager.updateClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'classroom-id-123', capacity: 0,
        });

        expect(result).toEqual({ error: 'capacity must be a positive integer' });
        expect(mongomodels.Classroom.findById).not.toHaveBeenCalled();
    });

    it('returns error when classroom is not found', async () => {
        mongomodels.Classroom.findById.mockResolvedValue(null);

        const result = await manager.updateClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'nonexistent-id',
        });

        expect(result).toEqual({ error: 'Classroom not found' });
    });

    it('returns error when classroom belongs to a different school', async () => {
        const mockClassroom = makeMockClassroom({ school: { toString: () => 'other-school-id' } });
        mongomodels.Classroom.findById.mockResolvedValue(mockClassroom);

        const result = await manager.updateClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'classroom-id-123', name: 'New Name',
        });

        expect(result).toEqual({ error: 'Access denied: classroom belongs to a different school' });
        expect(mockClassroom.save).not.toHaveBeenCalled();
    });

    it('updates name, capacity, and resources when provided', async () => {
        const mockClassroom = makeMockClassroom();
        mongomodels.Classroom.findById.mockResolvedValue(mockClassroom);

        await manager.updateClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'classroom-id-123', name: 'New Name', capacity: 40, resources: ['smartboard'],
        });

        expect(mockClassroom.name).toBe('New Name');
        expect(mockClassroom.capacity).toBe(40);
        expect(mockClassroom.resources).toEqual(['smartboard']);
        expect(mockClassroom.save).toHaveBeenCalled();
    });

    it('does not overwrite fields that are not provided', async () => {
        const mockClassroom = makeMockClassroom({ name: 'Original', capacity: 30, resources: ['projector'] });
        mongomodels.Classroom.findById.mockResolvedValue(mockClassroom);

        await manager.updateClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'classroom-id-123', name: 'Updated Name',
        });

        expect(mockClassroom.name).toBe('Updated Name');
        expect(mockClassroom.capacity).toBe(30);
        expect(mockClassroom.resources).toEqual(['projector']);
    });

    it('sets updatedAt and returns the updated classroom', async () => {
        const mockClassroom = makeMockClassroom();
        mongomodels.Classroom.findById.mockResolvedValue(mockClassroom);

        const result = await manager.updateClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'classroom-id-123', name: 'New Name',
        });

        expect(mockClassroom.updatedAt).toBeInstanceOf(Date);
        expect(result).toEqual({ classroom: mockClassroom });
    });
});
