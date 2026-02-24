'use strict';

const { makeMockSchool, buildManager } = require('./helpers');

describe('SchoolManager.createSchool', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['name is required'] };
        validators.school.createSchool.mockResolvedValue(validationError);

        const result = await manager.createSchool({ __token: {}, __superadmin: true, name: '', address: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.School.create).not.toHaveBeenCalled();
    });

    it('creates a school and returns it', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.create.mockResolvedValue(mockSchool);

        const result = await manager.createSchool({
            __token: {}, __superadmin: true,
            name: 'Test School', address: '123 Main St',
        });

        expect(mongomodels.School.create).toHaveBeenCalledWith({ name: 'Test School', address: '123 Main St' });
        expect(result).toEqual({ school: mockSchool });
    });
});
