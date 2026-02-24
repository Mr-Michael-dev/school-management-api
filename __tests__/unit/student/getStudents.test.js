'use strict';

const { makeMockStudent, buildManager } = require('./helpers');

describe('StudentManager.getStudents', () => {
    let manager, mongomodels;

    beforeEach(() => {
        ({ manager, mongomodels } = buildManager());
    });

    it('returns error when admin has no school assigned', async () => {
        const result = await manager.getStudents({ __token: { school: null }, __schoolAdmin: true });

        expect(result).toEqual({ error: 'Admin is not assigned to any school' });
        expect(mongomodels.Student.find).not.toHaveBeenCalled();
    });

    it('returns all students in the admins school when no classroom filter', async () => {
        const mockStudents = [makeMockStudent(), makeMockStudent({ _id: 'student-id-456' })];
        mongomodels.Student.find.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockStudents),
        });

        const result = await manager.getStudents({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
        });

        expect(mongomodels.Student.find).toHaveBeenCalledWith({ school: 'school-id-123' });
        expect(result).toEqual({ students: mockStudents });
    });

    it('filters by classroom when classroomId is provided', async () => {
        const mockStudents = [makeMockStudent()];
        mongomodels.Student.find.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockStudents),
        });

        await manager.getStudents({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            classroomId: 'classroom-id-123',
        });

        expect(mongomodels.Student.find).toHaveBeenCalledWith({
            school:    'school-id-123',
            classroom: 'classroom-id-123',
        });
    });
});
