'use strict';

const { makeMockStudent, buildManager } = require('./helpers');

describe('StudentManager.getStudent', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.student.getStudent.mockResolvedValue(validationError);

        const result = await manager.getStudent({ __token: {}, id: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.Student.findById).not.toHaveBeenCalled();
    });

    it('returns error when student is not found', async () => {
        mongomodels.Student.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            }),
        });

        const result = await manager.getStudent({ __token: {}, id: 'nonexistent-id' });

        expect(result).toEqual({ error: 'Student not found', code: 404 });
    });

    it('returns student with school and classroom populated', async () => {
        const mockStudent = makeMockStudent();
        mongomodels.Student.findById.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockStudent),
            }),
        });

        const result = await manager.getStudent({ __token: {}, id: 'student-id-123' });

        expect(mongomodels.Student.findById).toHaveBeenCalledWith('student-id-123');
        expect(result).toEqual({ student: mockStudent });
    });
});
