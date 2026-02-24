/**
 * @swagger
 * components:
 *   schemas:
 *     School:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         name:
 *           type: string
 *           example: Greenwood High
 *         address:
 *           type: string
 *           example: 123 Main St, Springfield
 *         admins:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of User ObjectIds assigned as school admins
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = class School {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.validators  = validators;
        this.mongomodels = mongomodels;
        this.managers    = managers;
        this.httpExposed = [
            'createSchool',
            'get=getSchool',
            'get=getSchools',
            'put=updateSchool',
            'delete=deleteSchool',
            'assignAdmin',
            'delete=removeAdmin',
        ];
    }

    /**
     * @swagger
     * /api/school/createSchool:
     *   post:
     *     summary: Create a new school (superadmin only)
     *     tags: [School]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name, address]
     *             properties:
     *               name:
     *                 type: string
     *                 example: Greenwood High
     *               address:
     *                 type: string
     *                 example: 123 Main St, Springfield
     *     responses:
     *       200:
     *         description: School created
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     school: { $ref: '#/components/schemas/School' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     */
    async createSchool({ __token, __superadmin, name, address }) {
        const result = await this.validators.school.createSchool({ name, address });
        if (result) return result;

        const school = await this.mongomodels.School.create({ name, address });
        return { school };
    }

    /**
     * @swagger
     * /api/school/getSchool:
     *   get:
     *     summary: Get a school by ID
     *     tags: [School]
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         example: 64f1a2b3c4d5e6f7a8b9c0d2
     *     responses:
     *       200:
     *         description: School found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     school: { $ref: '#/components/schemas/School' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: School not found
     */
    async getSchool({ __token, id }) {
        const result = await this.validators.school.getSchool({ id });
        if (result) return result;

        const school = await this.mongomodels.School.findById(id).populate('admins', 'username email role');
        if (!school) return { error: 'School not found', code: 404 };
        return { school };
    }

    /**
     * @swagger
     * /api/school/getSchools:
     *   get:
     *     summary: Get all schools (superadmin only)
     *     tags: [School]
     *     responses:
     *       200:
     *         description: List of schools
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     schools:
     *                       type: array
     *                       items: { $ref: '#/components/schemas/School' }
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     */
    async getSchools({ __token, __superadmin }) {
        const schools = await this.mongomodels.School.find().populate('admins', 'username email role');
        return { schools };
    }

    /**
     * @swagger
     * /api/school/updateSchool:
     *   put:
     *     summary: Update a school (superadmin only)
     *     tags: [School]
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
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d2
     *               name:
     *                 type: string
     *               address:
     *                 type: string
     *     responses:
     *       200:
     *         description: School updated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     school: { $ref: '#/components/schemas/School' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     *       404:
     *         description: School not found
     */
    async updateSchool({ __token, __superadmin, id, name, address }) {
        const result = await this.validators.school.updateSchool({ id, name, address });
        if (result) return result;

        const school = await this.mongomodels.School.findById(id);
        if (!school) return { error: 'School not found', code: 404 };

        if (name)    school.name    = name;
        if (address) school.address = address;
        school.updatedAt = new Date();

        await school.save();
        return { school };
    }

    /**
     * @swagger
     * /api/school/deleteSchool:
     *   delete:
     *     summary: Delete a school and cascade (superadmin only)
     *     description: Deletes the school, all its classrooms, all its students, and unassigns all school admins.
     *     tags: [School]
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         example: 64f1a2b3c4d5e6f7a8b9c0d2
     *     responses:
     *       200:
     *         description: School deleted
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:      { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     message: { type: string, example: School deleted successfully }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     *       404:
     *         description: School not found
     */
    async deleteSchool({ __token, __superadmin, id }) {
        const result = await this.validators.school.deleteSchool({ id });
        if (result) return result;

        const school = await this.mongomodels.School.findById(id);
        if (!school) return { error: 'School not found', code: 404 };

        // Cascade: remove all students and classrooms in this school
        await this.mongomodels.Student.deleteMany({ school: id });
        await this.mongomodels.Classroom.deleteMany({ school: id });

        // Unassign all school_admins from this school
        await this.mongomodels.User.updateMany({ school: id }, { $set: { school: null } });

        await this.mongomodels.School.findByIdAndDelete(id);
        return { message: 'School deleted successfully' };
    }

    /**
     * @swagger
     * /api/school/assignAdmin:
     *   post:
     *     summary: Assign a school_admin user to a school (superadmin only)
     *     tags: [School]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [schoolId, userId]
     *             properties:
     *               schoolId:
     *                 type: string
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d2
     *               userId:
     *                 type: string
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d1
     *     responses:
     *       200:
     *         description: Admin assigned successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     school: { $ref: '#/components/schemas/School' }
     *       400:
     *         description: Validation error or user already assigned to another school
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     *       404:
     *         description: School or user not found
     */
    async assignAdmin({ __token, __superadmin, schoolId, userId }) {
        const result = await this.validators.school.assignAdmin({ schoolId, userId });
        if (result) return result;

        const school = await this.mongomodels.School.findById(schoolId);
        if (!school) return { error: 'School not found', code: 404 };

        const user = await this.mongomodels.User.findById(userId);
        if (!user) return { error: 'User not found', code: 404 };

        if (user.role !== 'school_admin') return { error: 'User must have school_admin role' };

        if (user.school && user.school.toString() !== schoolId) {
            return { error: 'User is already assigned to another school' };
        }

        // $addToSet avoids duplicate entries in the admins array
        await this.mongomodels.School.findByIdAndUpdate(schoolId, { $addToSet: { admins: userId } });
        await this.mongomodels.User.findByIdAndUpdate(userId, { $set: { school: schoolId } });

        const updated = await this.mongomodels.School.findById(schoolId).populate('admins', 'username email role');
        return { school: updated };
    }

    /**
     * @swagger
     * /api/school/removeAdmin:
     *   delete:
     *     summary: Unassign an admin from a school (superadmin only)
     *     description: Removes the user from School.admins and clears User.school. Does NOT delete the user account.
     *     tags: [School]
     *     parameters:
     *       - in: query
     *         name: schoolId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Admin unassigned
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:      { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     message: { type: string, example: Admin removed from school }
     *       400:
     *         description: Validation error or user not assigned to this school
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — superadmin role required
     *       404:
     *         description: School not found
     */
    async removeAdmin({ __token, __superadmin, schoolId, userId }) {
        const result = await this.validators.school.removeAdmin({ schoolId, userId });
        if (result) return result;

        const school = await this.mongomodels.School.findById(schoolId);
        if (!school) return { error: 'School not found', code: 404 };

        const isAssigned = school.admins.some(a => a.toString() === userId);
        if (!isAssigned) return { error: 'User is not assigned to this school' };

        await this.mongomodels.School.findByIdAndUpdate(schoolId, { $pull: { admins: userId } });
        await this.mongomodels.User.findByIdAndUpdate(userId, { $set: { school: null } });

        return { message: 'Admin removed from school' };
    }
};
