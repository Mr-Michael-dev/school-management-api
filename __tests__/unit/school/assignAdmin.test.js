'use strict';

const { makeMockSchool, makeMockUser, buildManager } = require('./helpers');

describe('SchoolManager.assignAdmin', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['schoolId is required'] };
        validators.school.assignAdmin.mockResolvedValue(validationError);

        const result = await manager.assignAdmin({ __token: {}, __superadmin: true, schoolId: '', userId: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.School.findById).not.toHaveBeenCalled();
    });

    it('returns error when school is not found', async () => {
        mongomodels.School.findById.mockResolvedValue(null);

        const result = await manager.assignAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'nonexistent-school', userId: 'user-id-123',
        });

        expect(result).toEqual({ error: 'School not found', code: 404 });
        expect(mongomodels.User.findById).not.toHaveBeenCalled();
    });

    it('returns error when user is not found', async () => {
        mongomodels.School.findById.mockResolvedValue(makeMockSchool());
        mongomodels.User.findById.mockResolvedValue(null);

        const result = await manager.assignAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'nonexistent-user',
        });

        expect(result).toEqual({ error: 'User not found', code: 404 });
    });

    it('returns error when user does not have school_admin role', async () => {
        mongomodels.School.findById.mockResolvedValue(makeMockSchool());
        mongomodels.User.findById.mockResolvedValue(makeMockUser({ role: 'superadmin' }));

        const result = await manager.assignAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'user-id-123',
        });

        expect(result).toEqual({ error: 'User must have school_admin role' });
    });

    it('returns error when user is already assigned to another school', async () => {
        mongomodels.School.findById.mockResolvedValue(makeMockSchool());
        mongomodels.User.findById.mockResolvedValue(
            makeMockUser({ school: { toString: () => 'other-school-id' } })
        );

        const result = await manager.assignAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'user-id-123',
        });

        expect(result).toEqual({ error: 'User is already assigned to another school' });
    });

    it('allows assignment when user is already assigned to the same school', async () => {
        const updatedSchool = makeMockSchool({ admins: ['user-id-123'] });
        mongomodels.School.findById
            .mockResolvedValueOnce(makeMockSchool())
            .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(updatedSchool) });
        mongomodels.User.findById.mockResolvedValue(
            makeMockUser({ school: { toString: () => 'school-id-123' } })
        );
        mongomodels.School.findByIdAndUpdate.mockResolvedValue({});
        mongomodels.User.findByIdAndUpdate.mockResolvedValue({});

        const result = await manager.assignAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'user-id-123',
        });

        expect(result).toEqual({ school: updatedSchool });
    });

    it('adds user to school admins and sets user school on success', async () => {
        const updatedSchool = makeMockSchool();
        mongomodels.School.findById
            .mockResolvedValueOnce(makeMockSchool())
            .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(updatedSchool) });
        mongomodels.User.findById.mockResolvedValue(makeMockUser({ school: null }));
        mongomodels.School.findByIdAndUpdate.mockResolvedValue({});
        mongomodels.User.findByIdAndUpdate.mockResolvedValue({});

        await manager.assignAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'user-id-123',
        });

        expect(mongomodels.School.findByIdAndUpdate).toHaveBeenCalledWith(
            'school-id-123',
            { $addToSet: { admins: 'user-id-123' } }
        );
        expect(mongomodels.User.findByIdAndUpdate).toHaveBeenCalledWith(
            'user-id-123',
            { $set: { school: 'school-id-123' } }
        );
    });

    it('returns the updated school with admins populated', async () => {
        const updatedSchool = makeMockSchool({ admins: [makeMockUser()] });
        mongomodels.School.findById
            .mockResolvedValueOnce(makeMockSchool())
            .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(updatedSchool) });
        mongomodels.User.findById.mockResolvedValue(makeMockUser({ school: null }));
        mongomodels.School.findByIdAndUpdate.mockResolvedValue({});
        mongomodels.User.findByIdAndUpdate.mockResolvedValue({});

        const result = await manager.assignAdmin({
            __token: {}, __superadmin: true,
            schoolId: 'school-id-123', userId: 'user-id-123',
        });

        expect(result).toEqual({ school: updatedSchool });
    });
});
