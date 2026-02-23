/**
 * @swagger
 * components:
 *   schemas:
 *     Classroom:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d3
 *         name:
 *           type: string
 *           example: Grade 5 - Section A
 *         school:
 *           type: string
 *           description: School ObjectId
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         capacity:
 *           type: integer
 *           example: 30
 *         resources:
 *           type: array
 *           items:
 *             type: string
 *           example: [projector, whiteboard]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = class Classroom {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.validators  = validators;
        this.mongomodels = mongomodels;
        this.managers    = managers;
        this.httpExposed = [
            'createClassroom',
            'get=getClassroom',
            'get=getClassrooms',
            'put=updateClassroom',
            'delete=deleteClassroom',
        ];
    }

    /**
     * @swagger
     * /api/classroom/createClassroom:
     *   post:
     *     summary: Create a classroom in the admin's school (school_admin only)
     *     tags: [Classroom]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name:
     *                 type: string
     *                 example: Grade 5 - Section A
     *               capacity:
     *                 type: integer
     *                 example: 30
     *               resources:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: [projector, whiteboard]
     *     responses:
     *       200:
     *         description: Classroom created
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     classroom: { $ref: '#/components/schemas/Classroom' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — school_admin role required
     */
    async createClassroom({ __token, __schoolAdmin, name, capacity, resources }) {
        const result = await this.validators.classroom.createClassroom({ name });
        if (result) return result;

        if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
            return { error: 'capacity must be a positive integer' };
        }

        const school = __token.school;
        if (!school) return { error: 'Admin is not assigned to any school' };

        const classroom = await this.mongomodels.Classroom.create({
            name,
            school,
            capacity:  capacity  ?? null,
            resources: resources ?? [],
        });
        return { classroom };
    }

    /**
     * @swagger
     * /api/classroom/getClassroom:
     *   get:
     *     summary: Get a classroom by ID
     *     tags: [Classroom]
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         example: 64f1a2b3c4d5e6f7a8b9c0d3
     *     responses:
     *       200:
     *         description: Classroom found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     classroom: { $ref: '#/components/schemas/Classroom' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Classroom not found
     */
    async getClassroom({ __token, id }) {
        const result = await this.validators.classroom.getClassroom({ id });
        if (result) return result;

        const classroom = await this.mongomodels.Classroom.findById(id).populate('school', 'name address');
        if (!classroom) return { error: 'Classroom not found' };
        return { classroom };
    }

    /**
     * @swagger
     * /api/classroom/getClassrooms:
     *   get:
     *     summary: Get all classrooms in the admin's school (school_admin only)
     *     tags: [Classroom]
     *     responses:
     *       200:
     *         description: List of classrooms
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     classrooms:
     *                       type: array
     *                       items: { $ref: '#/components/schemas/Classroom' }
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — school_admin role required
     */
    async getClassrooms({ __token, __schoolAdmin }) {
        const school = __token.school;
        if (!school) return { error: 'Admin is not assigned to any school' };

        const classrooms = await this.mongomodels.Classroom.find({ school });
        return { classrooms };
    }

    /**
     * @swagger
     * /api/classroom/updateClassroom:
     *   put:
     *     summary: Update a classroom (school_admin, own school only)
     *     tags: [Classroom]
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
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d3
     *               name:
     *                 type: string
     *               capacity:
     *                 type: integer
     *               resources:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Classroom updated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     classroom: { $ref: '#/components/schemas/Classroom' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — not your school
     *       404:
     *         description: Classroom not found
     */
    async updateClassroom({ __token, __schoolAdmin, id, name, capacity, resources }) {
        const result = await this.validators.classroom.updateClassroom({ id, name });
        if (result) return result;

        if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
            return { error: 'capacity must be a positive integer' };
        }

        const classroom = await this.mongomodels.Classroom.findById(id);
        if (!classroom) return { error: 'Classroom not found' };

        if (classroom.school.toString() !== __token.school.toString()) {
            return { error: 'Access denied: classroom belongs to a different school' };
        }

        if (name      !== undefined) classroom.name      = name;
        if (capacity  !== undefined) classroom.capacity  = capacity;
        if (resources !== undefined) classroom.resources = resources;
        classroom.updatedAt = new Date();

        await classroom.save();
        return { classroom };
    }

    /**
     * @swagger
     * /api/classroom/deleteClassroom:
     *   delete:
     *     summary: Delete a classroom (school_admin, own school only)
     *     description: Blocked if students are still enrolled. Remove or transfer all students first.
     *     tags: [Classroom]
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         example: 64f1a2b3c4d5e6f7a8b9c0d3
     *     responses:
     *       200:
     *         description: Classroom deleted
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:      { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     message: { type: string, example: Classroom deleted successfully }
     *       400:
     *         description: Classroom has enrolled students — cannot delete
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — not your school
     *       404:
     *         description: Classroom not found
     */
    async deleteClassroom({ __token, __schoolAdmin, id }) {
        const result = await this.validators.classroom.deleteClassroom({ id });
        if (result) return result;

        const classroom = await this.mongomodels.Classroom.findById(id);
        if (!classroom) return { error: 'Classroom not found' };

        if (classroom.school.toString() !== __token.school.toString()) {
            return { error: 'Access denied: classroom belongs to a different school' };
        }

        const studentCount = await this.mongomodels.Student.countDocuments({ classroom: id });
        if (studentCount > 0) {
            return { error: `Cannot delete classroom with ${studentCount} enrolled student(s). Remove or transfer them first.` };
        }

        await this.mongomodels.Classroom.findByIdAndDelete(id);
        return { message: 'Classroom deleted successfully' };
    }
};
