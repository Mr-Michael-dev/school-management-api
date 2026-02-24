'use strict';

const { makeMockSchool, buildManager } = require('./helpers');

describe('SchoolManager.updateSchool', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.school.updateSchool.mockResolvedValue(validationError);

        const result = await manager.updateSchool({ __token: {}, __superadmin: true, id: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.School.findById).not.toHaveBeenCalled();
    });

    it('returns error when school is not found', async () => {
        mongomodels.School.findById.mockResolvedValue(null);

        const result = await manager.updateSchool({ __token: {}, __superadmin: true, id: 'nonexistent-id' });

        expect(result).toEqual({ error: 'School not found' });
    });

    it('updates name when provided', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.findById.mockResolvedValue(mockSchool);

        await manager.updateSchool({ __token: {}, __superadmin: true, id: 'school-id-123', name: 'New Name' });

        expect(mockSchool.name).toBe('New Name');
        expect(mockSchool.save).toHaveBeenCalled();
    });

    it('updates address when provided', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.findById.mockResolvedValue(mockSchool);

        await manager.updateSchool({ __token: {}, __superadmin: true, id: 'school-id-123', address: 'New Address' });

        expect(mockSchool.address).toBe('New Address');
        expect(mockSchool.save).toHaveBeenCalled();
    });

    it('does not overwrite fields that are not provided', async () => {
        const mockSchool = makeMockSchool({ name: 'Original Name', address: 'Original Address' });
        mongomodels.School.findById.mockResolvedValue(mockSchool);

        await manager.updateSchool({ __token: {}, __superadmin: true, id: 'school-id-123', name: 'Updated Name' });

        expect(mockSchool.name).toBe('Updated Name');
        expect(mockSchool.address).toBe('Original Address');
    });

    it('sets updatedAt and returns the updated school', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.findById.mockResolvedValue(mockSchool);

        const result = await manager.updateSchool({
            __token: {}, __superadmin: true,
            id: 'school-id-123', name: 'New Name', address: 'New Address',
        });

        expect(mockSchool.updatedAt).toBeInstanceOf(Date);
        expect(result).toEqual({ school: mockSchool });
    });
});
