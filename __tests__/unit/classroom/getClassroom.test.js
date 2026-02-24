'use strict';

const { makeMockClassroom, buildManager } = require('./helpers');

describe('ClassroomManager.getClassroom', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.classroom.getClassroom.mockResolvedValue(validationError);

        const result = await manager.getClassroom({ __token: {}, id: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.Classroom.findById).not.toHaveBeenCalled();
    });

    it('returns error when classroom is not found', async () => {
        mongomodels.Classroom.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
        });

        const result = await manager.getClassroom({ __token: {}, id: 'nonexistent-id' });

        expect(result).toEqual({ error: 'Classroom not found' });
    });

    it('returns classroom with school populated', async () => {
        const mockClassroom = makeMockClassroom();
        mongomodels.Classroom.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockClassroom),
        });

        const result = await manager.getClassroom({ __token: {}, id: 'classroom-id-123' });

        expect(mongomodels.Classroom.findById).toHaveBeenCalledWith('classroom-id-123');
        expect(result).toEqual({ classroom: mockClassroom });
    });
});
