/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         username:
 *           type: string
 *           example: john_doe
 *         email:
 *           type: string
 *           example: john@school.com
 *         role:
 *           type: string
 *           enum: [superadmin, school_admin]
 *         school:
 *           type: string
 *           description: School ObjectId (null if not assigned)
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         createdAt:
 *           type: string
 *           format: date-time
 */

module.exports = class User {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config       = config;
        this.validators   = validators;
        this.mongomodels  = mongomodels;
        this.managers     = managers;
        this.tokenManager = managers.token;
        this.httpExposed  = [
            'login',
            'createUser',
            'get=getUsers',
            'get=getUser',
            'put=updateUser',
            'put=updatePassword',
            'put=resetPassword',
            'delete=deleteUser',
        ];
    }

    /**
     * @swagger
     * /api/user/login:
     *   post:
     *     summary: Login and get a JWT token
     *     tags: [User]
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password]
     *             properties:
     *               email:
     *                 type: string
     *                 example: admin@school.com
     *               password:
     *                 type: string
     *                 example: secret123
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     longToken: { type: string }
     *                     user:      { $ref: '#/components/schemas/User' }
     *       400:
     *         description: Validation error or invalid credentials
     */
    async login({ email, password }) {
        const result = await this.validators.user.login({ email, password });
        if (result) return result;

        const user = await this.mongomodels.User.findOne({ email });
        if (!user) return { error: 'Invalid credentials' };

        const match = await user.comparePassword(password);
        if (!match) return { error: 'Invalid credentials' };

        const longToken = this.tokenManager.genLongToken({
            userId:  user._id,
            userKey: user.username,
            role:    user.role,
            school:  user.school,
        });

        return {
            longToken,
            user: {
                _id:      user._id,
                username: user.username,
                email:    user.email,
                role:     user.role,
                school:   user.school,
            },
        };
    }

    /**
     * @swagger
     * /api/user/createUser:
     *   post:
     *     summary: Create a new user account (superadmin only)
     *     tags: [User]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [username, email, password]
     *             properties:
     *               username:
     *                 type: string
     *                 example: john_doe
     *               email:
     *                 type: string
     *                 example: john@school.com
     *               password:
     *                 type: string
     *                 example: secret123
     *               role:
     *                 type: string
     *                 enum: [superadmin, school_admin]
     *                 default: school_admin
     *               school:
     *                 type: string
     *                 description: School ObjectId (required when role is school_admin)
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d1
     *     responses:
     *       200:
     *         description: User created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     user: { $ref: '#/components/schemas/User' }
     *       400:
     *         description: Validation error or duplicate username/email
     *       401:
     *         description: Unauthorized — missing or invalid token
     *       403:
     *         description: Forbidden — superadmin role required
     */
    async createUser({ __token, __superadmin, username, email, password, role, school }) {
        const result = await this.validators.user.createUser({ username, email, password, role, school });
        if (result) return result;

        const existing = await this.mongomodels.User.findOne({ $or: [{ email }, { username }] });
        if (existing) return { error: 'Username or email already in use' };

        if (role === 'school_admin') {
            if (!school) return { error: 'school id is required for school_admin role' };
            const schoolExists = await this.mongomodels.School.findById(school);
            if (!schoolExists) return { error: 'School not found' };
        }

        const user = await this.mongomodels.User.create({
            username,
            email,
            password,
            role:   role   || 'school_admin',
            school: school || null,
        });

        const userObj = user.toObject();
        delete userObj.password;
        return { user: userObj };
    }

    /**
     * @swagger
     * /api/user/getUsers:
     *   get:
     *     summary: Get all users (superadmin only)
     *     tags: [User]
     *     responses:
     *       200:
     *         description: List of users
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     users:
     *                       type: array
     *                       items: { $ref: '#/components/schemas/User' }
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     */
    async getUsers({ __token, __superadmin }) {
        const users = await this.mongomodels.User.find({}, '-password').populate('school', 'name');
        return { users };
    }

    /**
     * @swagger
     * /api/user/getUser:
     *   get:
     *     summary: Get a single user by ID (superadmin only)
     *     tags: [User]
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: User ObjectId
     *         example: 64f1a2b3c4d5e6f7a8b9c0d1
     *     responses:
     *       200:
     *         description: User found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     user: { $ref: '#/components/schemas/User' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     *       404:
     *         description: User not found
     */
    async getUser({ __token, __superadmin, id }) {
        const result = await this.validators.user.getUser({ id });
        if (result) return result;

        const user = await this.mongomodels.User.findById(id, '-password').populate('school', 'name');
        if (!user) return { error: 'User not found' };
        return { user };
    }

    /**
     * @swagger
     * /api/user/updateUser:
     *   put:
     *     summary: Update a user account
     *     description: |
     *       **Superadmin**: can update any user — username, email, role, school.
     *       **School admin**: can only update their own username (id must match own account; email, role, school are blocked).
     *     tags: [User]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [id]
     *             properties:
     *               id:
     *                 type: string
     *                 description: User ObjectId
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d1
     *               username:
     *                 type: string
     *               email:
     *                 type: string
     *                 description: Superadmin only
     *               role:
     *                 type: string
     *                 enum: [superadmin, school_admin]
     *                 description: Superadmin only
     *               school:
     *                 type: string
     *                 description: School ObjectId — superadmin only (pass null to unassign)
     *     responses:
     *       200:
     *         description: User updated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     user: { $ref: '#/components/schemas/User' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — school_admin trying to update another user or restricted field
     *       404:
     *         description: User not found
     */
    async updateUser({ __token, id, username, email, role, school }) {
        const result = await this.validators.user.updateUser({ id, username, email, role });
        if (result) return result;

        if (__token.role === 'school_admin') {
            if (id !== __token.userId.toString()) {
                return { error: 'Access denied: you can only update your own profile' };
            }
            if (email !== undefined || role !== undefined || school !== undefined) {
                return { error: 'Access denied: school_admin cannot update email, role, or school' };
            }
        }

        const user = await this.mongomodels.User.findById(id);
        if (!user) return { error: 'User not found' };

        if (username)             user.username = username;

        if (__token.role === 'superadmin') {
            if (email)                user.email  = email;
            if (role)                 user.role   = role;
            if (school !== undefined) user.school = school || null;
        }

        await user.save();
        const userObj = user.toObject();
        delete userObj.password;
        return { user: userObj };
    }

    /**
     * @swagger
     * /api/user/updatePassword:
     *   put:
     *     summary: Update own password (any authenticated user)
     *     tags: [User]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [currentPassword, newPassword]
     *             properties:
     *               currentPassword:
     *                 type: string
     *                 description: Current password for verification
     *               newPassword:
     *                 type: string
     *                 description: New password (min 8 characters)
     *     responses:
     *       200:
     *         description: Password updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:      { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     message: { type: string, example: Password updated successfully }
     *       400:
     *         description: Validation error or incorrect current password
     *       401:
     *         description: Unauthorized
     */
    async updatePassword({ __token, currentPassword, newPassword }) {
        const result = await this.validators.user.updatePassword({ currentPassword, newPassword });
        if (result) return result;

        const user = await this.mongomodels.User.findById(__token.userId);
        if (!user) return { error: 'User not found' };

        const match = await user.comparePassword(currentPassword);
        if (!match) return { error: 'Current password is incorrect' };

        user.password = newPassword;
        await user.save(); // pre-save hook re-hashes automatically
        return { message: 'Password updated successfully' };
    }

    /**
     * @swagger
     * /api/user/resetPassword:
     *   put:
     *     summary: Reset any user's password (superadmin only)
     *     description: Used when a user forgets their password. No current password required.
     *     tags: [User]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [id, newPassword]
     *             properties:
     *               id:
     *                 type: string
     *                 description: Target user ObjectId
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d1
     *               newPassword:
     *                 type: string
     *                 description: New password to set (min 8 characters)
     *     responses:
     *       200:
     *         description: Password reset successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:      { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     message: { type: string, example: Password reset successfully }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     *       404:
     *         description: User not found
     */
    async resetPassword({ __token, __superadmin, id, newPassword }) {
        const result = await this.validators.user.resetPassword({ id, newPassword });
        if (result) return result;

        const user = await this.mongomodels.User.findById(id);
        if (!user) return { error: 'User not found' };

        user.password = newPassword;
        await user.save(); // pre-save hook re-hashes automatically
        return { message: 'Password reset successfully' };
    }

    /**
     * @swagger
     * /api/user/deleteUser:
     *   delete:
     *     summary: Permanently delete a user account (superadmin only)
     *     tags: [User]
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: User ObjectId
     *         example: 64f1a2b3c4d5e6f7a8b9c0d1
     *     responses:
     *       200:
     *         description: User deleted
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:      { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     message: { type: string, example: User deleted successfully }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     *       404:
     *         description: User not found
     */
    async deleteUser({ __token, __superadmin, id }) {
        const result = await this.validators.user.deleteUser({ id });
        if (result) return result;

        const user = await this.mongomodels.User.findById(id);
        if (!user) return { error: 'User not found' };

        // Clean up school assignment if school_admin
        if (user.role === 'school_admin' && user.school) {
            await this.mongomodels.School.findByIdAndUpdate(
                user.school,
                { $pull: { admins: user._id } }
            );
        }

        await this.mongomodels.User.findByIdAndDelete(id);
        return { message: 'User deleted successfully' };
    }
};
