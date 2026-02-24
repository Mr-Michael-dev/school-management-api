'use strict';

const { makeMockClassroom, buildManager } = require('./helpers');

describe('ClassroomManager.getClassrooms', () => {
    let manager, mongomodels;

    beforeEach(() => {
        ({ manager, mongomodels } = buildManager());
    });

    it('returns error when admin has no school assigned', async () => {
        const result = await manager.getClassrooms({ __token: { school: null }, __schoolAdmin: true });

        expect(result).toEqual({ error: 'Admin is not assigned to any school' });
        expect(mongomodels.Classroom.find).not.toHaveBeenCalled();
    });

    it('returns classrooms scoped to the admins school', async () => {
        const mockClassrooms = [makeMockClassroom(), makeMockClassroom({ _id: 'classroom-id-456' })];
        mongomodels.Classroom.find.mockResolvedValue(mockClassrooms);

        const result = await manager.getClassrooms({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
        });

        expect(mongomodels.Classroom.find).toHaveBeenCalledWith({ school: 'school-id-123' });
        expect(result).toEqual({ classrooms: mockClassrooms });
    });
});
