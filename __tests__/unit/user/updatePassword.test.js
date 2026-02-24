'use strict';

const { makeMockUser, buildManager } = require('./helpers');

describe('UserManager.updatePassword', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['currentPassword is required'] };
        validators.user.updatePassword.mockResolvedValue(validationError);

        const result = await manager.updatePassword({
            __token: { userId: 'user-id-123' },
            currentPassword: '', newPassword: '',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.User.findById).not.toHaveBeenCalled();
    });

    it('returns error when the authenticated user is not found', async () => {
        mongomodels.User.findById.mockResolvedValue(null);

        const result = await manager.updatePassword({
            __token: { userId: 'user-id-123' },
            currentPassword: 'old', newPassword: 'new',
        });

        expect(result).toEqual({ error: 'User not found', code: 404 });
    });

    it('returns error when current password is incorrect', async () => {
        const mockUser = makeMockUser();
        mockUser.comparePassword.mockResolvedValue(false);
        mongomodels.User.findById.mockResolvedValue(mockUser);

        const result = await manager.updatePassword({
            __token: { userId: 'user-id-123' },
            currentPassword: 'wrongpassword', newPassword: 'newpassword123',
        });

        expect(result).toEqual({ error: 'Current password is incorrect' });
        expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('updates password and saves when current password is correct', async () => {
        const mockUser = makeMockUser();
        mockUser.comparePassword.mockResolvedValue(true);
        mongomodels.User.findById.mockResolvedValue(mockUser);

        const result = await manager.updatePassword({
            __token: { userId: 'user-id-123' },
            currentPassword: 'currentpass', newPassword: 'newpassword123',
        });

        expect(mockUser.password).toBe('newpassword123');
        expect(mockUser.save).toHaveBeenCalled();
        expect(result).toEqual({ message: 'Password updated successfully' });
    });

    it('looks up the user from the token, not from request body', async () => {
        const mockUser = makeMockUser();
        mongomodels.User.findById.mockResolvedValue(mockUser);

        await manager.updatePassword({
            __token: { userId: 'token-user-id' },
            currentPassword: 'currentpass', newPassword: 'newpassword123',
        });

        expect(mongomodels.User.findById).toHaveBeenCalledWith('token-user-id');
    });
});
