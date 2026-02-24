'use strict';

const { makeMockUser, buildManager } = require('./helpers');

describe('UserManager.createUser', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['email is required'] };
        validators.user.createUser.mockResolvedValue(validationError);

        const result = await manager.createUser({});

        expect(result).toBe(validationError);
        expect(mongomodels.User.findOne).not.toHaveBeenCalled();
    });

    it('returns error when username or email is already in use', async () => {
        mongomodels.User.findOne.mockResolvedValue(makeMockUser());

        const result = await manager.createUser({
            username: 'testuser', email: 'test@school.com', password: 'pass123',
        });

        expect(result).toEqual({ error: 'Username or email already in use' });
        expect(mongomodels.User.create).not.toHaveBeenCalled();
    });

    it('returns error when role is school_admin but no school id is provided', async () => {
        mongomodels.User.findOne.mockResolvedValue(null);

        const result = await manager.createUser({
            username: 'newuser', email: 'new@school.com', password: 'pass123',
            role: 'school_admin', school: undefined,
        });

        expect(result).toEqual({ error: 'school id is required for school_admin role' });
    });

    it('returns error when the provided school does not exist', async () => {
        mongomodels.User.findOne.mockResolvedValue(null);
        mongomodels.School.findById.mockResolvedValue(null);

        const result = await manager.createUser({
            username: 'newuser', email: 'new@school.com', password: 'pass123',
            role: 'school_admin', school: 'nonexistent-school-id',
        });

        expect(result).toEqual({ error: 'School not found' });
    });

    it('creates a school_admin user and strips password from response', async () => {
        mongomodels.User.findOne.mockResolvedValue(null);
        mongomodels.School.findById.mockResolvedValue({ _id: 'school-id-123' });
        const mockCreatedUser = makeMockUser();
        mongomodels.User.create.mockResolvedValue(mockCreatedUser);

        const result = await manager.createUser({
            username: 'newuser', email: 'new@school.com', password: 'pass123',
            role: 'school_admin', school: 'school-id-123',
        });

        expect(mongomodels.User.create).toHaveBeenCalledWith({
            username: 'newuser',
            email:    'new@school.com',
            password: 'pass123',
            role:     'school_admin',
            school:   'school-id-123',
        });
        expect(result.user).toBeDefined();
        expect(result.user.password).toBeUndefined();
    });

    it('creates a superadmin user without school validation', async () => {
        mongomodels.User.findOne.mockResolvedValue(null);
        const mockCreatedUser = makeMockUser({ role: 'superadmin', school: null });
        mongomodels.User.create.mockResolvedValue(mockCreatedUser);

        const result = await manager.createUser({
            username: 'superuser', email: 'super@school.com', password: 'pass123',
            role: 'superadmin',
        });

        expect(mongomodels.School.findById).not.toHaveBeenCalled();
        expect(mongomodels.User.create).toHaveBeenCalledWith({
            username: 'superuser',
            email:    'super@school.com',
            password: 'pass123',
            role:     'superadmin',
            school:   null,
        });
        expect(result.user).toBeDefined();
    });
});
