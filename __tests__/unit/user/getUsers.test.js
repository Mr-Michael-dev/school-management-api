'use strict';

const { makeMockUser, buildManager } = require('./helpers');

describe('UserManager.getUsers', () => {
    let manager, mongomodels;

    beforeEach(() => {
        ({ manager, mongomodels } = buildManager());
    });

    it('returns all users with school populated and password excluded', async () => {
        const mockUsers = [makeMockUser(), makeMockUser({ _id: 'user-id-456' })];
        mongomodels.User.find.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockUsers),
        });

        const result = await manager.getUsers({ __token: {}, __superadmin: true });

        expect(mongomodels.User.find).toHaveBeenCalledWith({}, '-password');
        expect(result).toEqual({ users: mockUsers });
    });
});
