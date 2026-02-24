'use strict';

const { makeMockUser, buildManager } = require('./helpers');

describe('UserManager.updateUser', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.user.updateUser.mockResolvedValue(validationError);

        const result = await manager.updateUser({ __token: { role: 'superadmin' }, id: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.User.findById).not.toHaveBeenCalled();
    });

    it('school_admin cannot update another user profile', async () => {
        const result = await manager.updateUser({
            __token: { role: 'school_admin', userId: 'my-id' },
            id:      'other-user-id',
            username: 'newname',
        });

        expect(result).toEqual({ error: 'Access denied: you can only update your own profile' });
        expect(mongomodels.User.findById).not.toHaveBeenCalled();
    });

    it('school_admin cannot update email', async () => {
        const result = await manager.updateUser({
            __token: { role: 'school_admin', userId: 'my-id' },
            id:      'my-id',
            email:   'new@email.com',
        });

        expect(result).toEqual({ error: 'Access denied: school_admin cannot update email, role, or school' });
    });

    it('school_admin cannot update role', async () => {
        const result = await manager.updateUser({
            __token: { role: 'school_admin', userId: 'my-id' },
            id:      'my-id',
            role:    'superadmin',
        });

        expect(result).toEqual({ error: 'Access denied: school_admin cannot update email, role, or school' });
    });

    it('school_admin cannot update school', async () => {
        const result = await manager.updateUser({
            __token: { role: 'school_admin', userId: 'my-id' },
            id:      'my-id',
            school:  'another-school-id',
        });

        expect(result).toEqual({ error: 'Access denied: school_admin cannot update email, role, or school' });
    });

    it('school_admin can update their own username', async () => {
        const mockUser = makeMockUser({ _id: 'my-id', role: 'school_admin' });
        mongomodels.User.findById.mockResolvedValue(mockUser);

        const result = await manager.updateUser({
            __token:  { role: 'school_admin', userId: 'my-id' },
            id:       'my-id',
            username: 'newusername',
        });

        expect(mockUser.username).toBe('newusername');
        expect(mockUser.save).toHaveBeenCalled();
        expect(result.user).toBeDefined();
        expect(result.user.password).toBeUndefined();
    });

    it('returns error when user to update is not found', async () => {
        mongomodels.User.findById.mockResolvedValue(null);

        const result = await manager.updateUser({
            __token: { role: 'superadmin' },
            id:      'nonexistent-id',
        });

        expect(result).toEqual({ error: 'User not found', code: 404 });
    });

    it('superadmin can update username, email, role, and school', async () => {
        const mockUser = makeMockUser();
        mongomodels.User.findById.mockResolvedValue(mockUser);

        await manager.updateUser({
            __token:  { role: 'superadmin' },
            id:       'user-id-123',
            username: 'newname',
            email:    'new@email.com',
            role:     'superadmin',
            school:   'new-school-id',
        });

        expect(mockUser.username).toBe('newname');
        expect(mockUser.email).toBe('new@email.com');
        expect(mockUser.role).toBe('superadmin');
        expect(mockUser.school).toBe('new-school-id');
        expect(mockUser.save).toHaveBeenCalled();
    });

    it('superadmin can unassign school by passing null', async () => {
        const mockUser = makeMockUser({ school: 'school-id-123' });
        mongomodels.User.findById.mockResolvedValue(mockUser);

        await manager.updateUser({
            __token: { role: 'superadmin' },
            id:      'user-id-123',
            school:  null,
        });

        expect(mockUser.school).toBeNull();
        expect(mockUser.save).toHaveBeenCalled();
    });
});
