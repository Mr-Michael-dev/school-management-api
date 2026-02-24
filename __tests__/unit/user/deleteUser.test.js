'use strict';

const { makeMockUser, buildManager } = require('./helpers');

describe('UserManager.deleteUser', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.user.deleteUser.mockResolvedValue(validationError);

        const result = await manager.deleteUser({ __token: {}, __superadmin: true, id: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.User.findById).not.toHaveBeenCalled();
    });

    it('returns error when user is not found', async () => {
        mongomodels.User.findById.mockResolvedValue(null);

        const result = await manager.deleteUser({
            __token: {}, __superadmin: true, id: 'nonexistent-id',
        });

        expect(result).toEqual({ error: 'User not found', code: 404 });
        expect(mongomodels.User.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('removes user from school.admins array when deleting a school_admin', async () => {
        const mockUser = makeMockUser({ role: 'school_admin', school: 'school-id-123' });
        mongomodels.User.findById.mockResolvedValue(mockUser);
        mongomodels.School.findByIdAndUpdate.mockResolvedValue({});
        mongomodels.User.findByIdAndDelete.mockResolvedValue({});

        const result = await manager.deleteUser({
            __token: {}, __superadmin: true, id: 'user-id-123',
        });

        expect(mongomodels.School.findByIdAndUpdate).toHaveBeenCalledWith(
            'school-id-123',
            { $pull: { admins: mockUser._id } }
        );
        expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('skips school cleanup when deleting a superadmin', async () => {
        const mockUser = makeMockUser({ role: 'superadmin', school: null });
        mongomodels.User.findById.mockResolvedValue(mockUser);
        mongomodels.User.findByIdAndDelete.mockResolvedValue({});

        await manager.deleteUser({ __token: {}, __superadmin: true, id: 'user-id-123' });

        expect(mongomodels.School.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('skips school cleanup when school_admin has no school assigned', async () => {
        const mockUser = makeMockUser({ role: 'school_admin', school: null });
        mongomodels.User.findById.mockResolvedValue(mockUser);
        mongomodels.User.findByIdAndDelete.mockResolvedValue({});

        await manager.deleteUser({ __token: {}, __superadmin: true, id: 'user-id-123' });

        expect(mongomodels.School.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('always calls findByIdAndDelete on the correct id', async () => {
        const mockUser = makeMockUser({ role: 'superadmin', school: null });
        mongomodels.User.findById.mockResolvedValue(mockUser);
        mongomodels.User.findByIdAndDelete.mockResolvedValue({});

        await manager.deleteUser({ __token: {}, __superadmin: true, id: 'user-id-123' });

        expect(mongomodels.User.findByIdAndDelete).toHaveBeenCalledWith('user-id-123');
    });
});
