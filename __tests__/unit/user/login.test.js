'use strict';

const { makeMockUser, buildManager } = require('./helpers');

describe('UserManager.login', () => {
    let manager, validators, mongomodels, tokenManager;

    beforeEach(() => {
        ({ manager, validators, mongomodels, tokenManager } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['email is required'] };
        validators.user.login.mockResolvedValue(validationError);

        const result = await manager.login({ email: '', password: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.User.findOne).not.toHaveBeenCalled();
    });

    it('returns "Invalid credentials" when user does not exist', async () => {
        mongomodels.User.findOne.mockResolvedValue(null);

        const result = await manager.login({ email: 'no@one.com', password: 'secret' });

        expect(result).toEqual({ error: 'Invalid credentials' });
    });

    it('returns "Invalid credentials" when password does not match', async () => {
        const mockUser = makeMockUser();
        mockUser.comparePassword.mockResolvedValue(false);
        mongomodels.User.findOne.mockResolvedValue(mockUser);

        const result = await manager.login({ email: 'test@school.com', password: 'wrongpass' });

        expect(result).toEqual({ error: 'Invalid credentials' });
    });

    it('returns longToken and full user object on success', async () => {
        const mockUser = makeMockUser({ role: 'superadmin', school: null });
        mockUser.comparePassword.mockResolvedValue(true);
        mongomodels.User.findOne.mockResolvedValue(mockUser);

        const result = await manager.login({ email: 'test@school.com', password: 'correct' });

        expect(tokenManager.genLongToken).toHaveBeenCalledWith({
            userId:  mockUser._id,
            userKey: mockUser.username,
            role:    mockUser.role,
            school:  mockUser.school,
        });
        expect(result).toEqual({
            longToken: 'mock-jwt-token',
            user: {
                _id:      mockUser._id,
                username: mockUser.username,
                email:    mockUser.email,
                role:     mockUser.role,
                school:   mockUser.school,
            },
        });
    });

    it('does not expose password in the login response', async () => {
        const mockUser = makeMockUser();
        mongomodels.User.findOne.mockResolvedValue(mockUser);

        const result = await manager.login({ email: 'test@school.com', password: 'correct' });

        expect(result.user.password).toBeUndefined();
    });
});
