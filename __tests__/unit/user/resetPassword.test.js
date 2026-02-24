'use strict';

const { makeMockUser, buildManager } = require('./helpers');

describe('UserManager.resetPassword', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.user.resetPassword.mockResolvedValue(validationError);

        const result = await manager.resetPassword({
            __token: {}, __superadmin: true,
            id: '', newPassword: '',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.User.findById).not.toHaveBeenCalled();
    });

    it('returns error when target user is not found', async () => {
        mongomodels.User.findById.mockResolvedValue(null);

        const result = await manager.resetPassword({
            __token: {}, __superadmin: true,
            id: 'nonexistent-id', newPassword: 'newpass123',
        });

        expect(result).toEqual({ error: 'User not found' });
    });

    it('resets password without requiring the current password', async () => {
        const mockUser = makeMockUser();
        mongomodels.User.findById.mockResolvedValue(mockUser);

        const result = await manager.resetPassword({
            __token: {}, __superadmin: true,
            id: 'user-id-123', newPassword: 'resetpassword123',
        });

        expect(mockUser.comparePassword).not.toHaveBeenCalled();
        expect(mockUser.password).toBe('resetpassword123');
        expect(mockUser.save).toHaveBeenCalled();
        expect(result).toEqual({ message: 'Password reset successfully' });
    });
});
