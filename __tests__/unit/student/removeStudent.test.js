'use strict';

const { makeMockStudent, buildManager } = require('./helpers');

describe('StudentManager.removeStudent', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.student.removeStudent.mockResolvedValue(validationError);

        const result = await manager.removeStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: '',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.Student.findById).not.toHaveBeenCalled();
    });

    it('returns error when student is not found', async () => {
        mongomodels.Student.findById.mockResolvedValue(null);

        const result = await manager.removeStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'nonexistent-id',
        });

        expect(result).toEqual({ error: 'Student not found' });
        expect(mongomodels.Student.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('returns error when student belongs to a different school', async () => {
        const mockStudent = makeMockStudent({ school: { toString: () => 'other-school-id' } });
        mongomodels.Student.findById.mockResolvedValue(mockStudent);

        const result = await manager.removeStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'student-id-123',
        });

        expect(result).toEqual({ error: 'Access denied: student belongs to a different school' });
        expect(mongomodels.Student.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('calls findByIdAndDelete on the correct id', async () => {
        mongomodels.Student.findById.mockResolvedValue(makeMockStudent());
        mongomodels.Student.findByIdAndDelete.mockResolvedValue({});

        await manager.removeStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'student-id-123',
        });

        expect(mongomodels.Student.findByIdAndDelete).toHaveBeenCalledWith('student-id-123');
    });

    it('returns success message after removal', async () => {
        mongomodels.Student.findById.mockResolvedValue(makeMockStudent());
        mongomodels.Student.findByIdAndDelete.mockResolvedValue({});

        const result = await manager.removeStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'student-id-123',
        });

        expect(result).toEqual({ message: 'Student removed successfully' });
    });
});
