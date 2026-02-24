'use strict';

const { makeMockClassroom, buildManager } = require('./helpers');

describe('ClassroomManager.deleteClassroom', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.classroom.deleteClassroom.mockResolvedValue(validationError);

        const result = await manager.deleteClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: '',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.Classroom.findById).not.toHaveBeenCalled();
    });

    it('returns error when classroom is not found', async () => {
        mongomodels.Classroom.findById.mockResolvedValue(null);

        const result = await manager.deleteClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'nonexistent-id',
        });

        expect(result).toEqual({ error: 'Classroom not found', code: 404 });
        expect(mongomodels.Classroom.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('returns error when classroom belongs to a different school', async () => {
        const mockClassroom = makeMockClassroom({ school: { toString: () => 'other-school-id' } });
        mongomodels.Classroom.findById.mockResolvedValue(mockClassroom);

        const result = await manager.deleteClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'classroom-id-123',
        });

        expect(result).toEqual({ error: 'Access denied: classroom belongs to a different school' });
        expect(mongomodels.Classroom.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('returns error when students are enrolled in the classroom', async () => {
        const mockClassroom = makeMockClassroom();
        mongomodels.Classroom.findById.mockResolvedValue(mockClassroom);
        mongomodels.Student.countDocuments.mockResolvedValue(3);

        const result = await manager.deleteClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'classroom-id-123',
        });

        expect(result).toEqual({
            error: 'Cannot delete classroom with 3 enrolled student(s). Remove or transfer them first.',
        });
        expect(mongomodels.Classroom.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('calls findByIdAndDelete on the correct id when classroom is empty', async () => {
        const mockClassroom = makeMockClassroom();
        mongomodels.Classroom.findById.mockResolvedValue(mockClassroom);
        mongomodels.Student.countDocuments.mockResolvedValue(0);
        mongomodels.Classroom.findByIdAndDelete.mockResolvedValue({});

        await manager.deleteClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'classroom-id-123',
        });

        expect(mongomodels.Classroom.findByIdAndDelete).toHaveBeenCalledWith('classroom-id-123');
    });

    it('returns success message after deletion', async () => {
        const mockClassroom = makeMockClassroom();
        mongomodels.Classroom.findById.mockResolvedValue(mockClassroom);
        mongomodels.Student.countDocuments.mockResolvedValue(0);
        mongomodels.Classroom.findByIdAndDelete.mockResolvedValue({});

        const result = await manager.deleteClassroom({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'classroom-id-123',
        });

        expect(result).toEqual({ message: 'Classroom deleted successfully' });
    });
});
