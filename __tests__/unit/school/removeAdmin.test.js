'use strict';

const { makeMockSchool, buildManager } = require('./helpers');

describe('SchoolManager.removeAdmin', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['schoolId is required'] };
        validators.school.removeAdmin.mockResolvedValue(validationError);

        const result = await manager.removeAdmin({ __token: {}, __superadmin: true, schoolId: '', userId: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.School.findById).not.toHaveBeenCalled();
    });

    it('returns error when school is not found', async () => {
        mongomodels.School.findById.mockResolvedValue(null);

        const result = await manager.removeAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'nonexistent-school', userId: 'user-id-123',
        });

        expect(result).toEqual({ error: 'School not found', code: 404 });
    });

    it('returns error when user is not assigned to this school', async () => {
        const mockSchool = makeMockSchool({
            admins: [{ toString: () => 'other-user-id' }],
        });
        mongomodels.School.findById.mockResolvedValue(mockSchool);

        const result = await manager.removeAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'user-id-123',
        });

        expect(result).toEqual({ error: 'User is not assigned to this school' });
        expect(mongomodels.School.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('pulls user from school admins and clears user school', async () => {
        const mockSchool = makeMockSchool({
            admins: [{ toString: () => 'user-id-123' }],
        });
        mongomodels.School.findById.mockResolvedValue(mockSchool);
        mongomodels.School.findByIdAndUpdate.mockResolvedValue({});
        mongomodels.User.findByIdAndUpdate.mockResolvedValue({});

        await manager.removeAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'user-id-123',
        });

        expect(mongomodels.School.findByIdAndUpdate).toHaveBeenCalledWith(
            'school-id-123',
            { $pull: { admins: 'user-id-123' } }
        );
        expect(mongomodels.User.findByIdAndUpdate).toHaveBeenCalledWith(
            'user-id-123',
            { $set: { school: null } }
        );
    });

    it('returns success message after removal', async () => {
        const mockSchool = makeMockSchool({
            admins: [{ toString: () => 'user-id-123' }],
        });
        mongomodels.School.findById.mockResolvedValue(mockSchool);
        mongomodels.School.findByIdAndUpdate.mockResolvedValue({});
        mongomodels.User.findByIdAndUpdate.mockResolvedValue({});

        const result = await manager.removeAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'user-id-123',
        });

        expect(result).toEqual({ message: 'Admin removed from school' });
    });
});
