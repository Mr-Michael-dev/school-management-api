'use strict';

const { makeMockSchool, buildManager } = require('./helpers');

describe('SchoolManager.getSchool', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.school.getSchool.mockResolvedValue(validationError);

        const result = await manager.getSchool({ __token: {}, id: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.School.findById).not.toHaveBeenCalled();
    });

    it('returns error when school is not found', async () => {
        mongomodels.School.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
        });

        const result = await manager.getSchool({ __token: {}, id: 'nonexistent-id' });

        expect(result).toEqual({ error: 'School not found', code: 404 });
    });

    it('returns school with admins populated', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockSchool),
        });

        const result = await manager.getSchool({ __token: {}, id: 'school-id-123' });

        expect(mongomodels.School.findById).toHaveBeenCalledWith('school-id-123');
        expect(result).toEqual({ school: mockSchool });
    });
});
