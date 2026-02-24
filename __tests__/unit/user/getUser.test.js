'use strict';

const { makeMockUser, buildManager } = require('./helpers');

describe('UserManager.getUser', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.user.getUser.mockResolvedValue(validationError);

        const result = await manager.getUser({ id: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.User.findById).not.toHaveBeenCalled();
    });

    it('returns error when user is not found', async () => {
        mongomodels.User.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
        });

        const result = await manager.getUser({ id: 'nonexistent-id' });

        expect(result).toEqual({ error: 'User not found', code: 404 });
    });

    it('returns user with school populated and password excluded', async () => {
        const mockUser = makeMockUser();
        mongomodels.User.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockUser),
        });

        const result = await manager.getUser({ id: 'user-id-123' });

        expect(mongomodels.User.findById).toHaveBeenCalledWith('user-id-123', '-password');
        expect(result).toEqual({ user: mockUser });
    });
});
