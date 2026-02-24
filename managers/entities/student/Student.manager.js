/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d4
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         email:
 *           type: string
 *           example: john.doe@student.com
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: 2010-05-14
 *         school:
 *           type: string
 *           description: School ObjectId
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         classroom:
 *           type: string
 *           description: Classroom ObjectId
 *           example: 64f1a2b3c4d5e6f7a8b9c0d3
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = class Student {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.validators  = validators;
        this.mongomodels = mongomodels;
        this.managers    = managers;
        this.httpExposed = [
            'enrollStudent',
            'get=getStudent',
            'get=getStudents',
            'put=updateStudent',
            'put=transferStudent',
            'delete=removeStudent',
        ];
    }

    /**
     * @swagger
     * /api/student/enrollStudent:
     *   post:
     *     summary: Enroll a student into a classroom (school_admin only)
     *     tags: [Student]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [firstName, lastName, classroomId]
     *             properties:
     *               firstName:
     *                 type: string
     *                 example: John
     *               lastName:
     *                 type: string
     *                 example: Doe
     *               email:
     *                 type: string
     *                 example: john.doe@student.com
     *               dateOfBirth:
     *                 type: string
     *                 format: date
     *                 example: 2010-05-14
     *               classroomId:
     *                 type: string
     *                 description: Target classroom ObjectId (must belong to admin's school)
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d3
     *     responses:
     *       200:
     *         description: Student enrolled
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     student: { $ref: '#/components/schemas/Student' }
     *       400:
     *         description: Validation error or classroom not in admin's school
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — school_admin role required
     */
    async enrollStudent({ __token, __schoolAdmin, firstName, lastName, email, dateOfBirth, classroomId }) {
        const result = await this.validators.student.enrollStudent({ firstName, lastName, email, classroomId });
        if (result) return result;

        const school = __token.school;
        if (!school) return { error: 'Admin is not assigned to any school' };

        const classroom = await this.mongomodels.Classroom.findById(classroomId);
        if (!classroom) return { error: 'Classroom not found' };
        if (classroom.school.toString() !== school.toString()) {
            return { error: 'Classroom does not belong to your school' };
        }

        if (email) {
            const existing = await this.mongomodels.Student.findOne({ email });
            if (existing) return { error: 'A student with this email already exists' };
        }

        if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
            return { error: 'Invalid dateOfBirth format' };
        }

        const student = await this.mongomodels.Student.create({
            firstName,
            lastName,
            email:       email       || undefined,
            dateOfBirth: dateOfBirth || null,
            school,
            classroom:   classroomId,
        });
        return { student };
    }

    /**
     * @swagger
     * /api/student/getStudent:
     *   get:
     *     summary: Get a student by ID
     *     tags: [Student]
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         example: 64f1a2b3c4d5e6f7a8b9c0d4
     *     responses:
     *       200:
     *         description: Student found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     student: { $ref: '#/components/schemas/Student' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Student not found
     */
    async getStudent({ __token, id }) {
        const result = await this.validators.student.getStudent({ id });
        if (result) return result;

        const student = await this.mongomodels.Student.findById(id)
            .populate('school',    'name')
            .populate('classroom', 'name');
        if (!student) return { error: 'Student not found' };
        return { student };
    }

    /**
     * @swagger
     * /api/student/getStudents:
     *   get:
     *     summary: Get all students in the admin's school (school_admin only)
     *     tags: [Student]
     *     parameters:
     *       - in: query
     *         name: classroomId
     *         required: false
     *         schema:
     *           type: string
     *         description: Optional — filter by classroom
     *     responses:
     *       200:
     *         description: List of students
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     students:
     *                       type: array
     *                       items: { $ref: '#/components/schemas/Student' }
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — school_admin role required
     */
    async getStudents({ __token, __schoolAdmin, classroomId }) {
        const school = __token.school;
        if (!school) return { error: 'Admin is not assigned to any school' };

        const filter = { school };
        if (classroomId) filter.classroom = classroomId;

        const students = await this.mongomodels.Student.find(filter).populate('classroom', 'name');
        return { students };
    }

    /**
     * @swagger
     * /api/student/updateStudent:
     *   put:
     *     summary: Update a student's details (school_admin, own school only)
     *     tags: [Student]
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
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d4
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               email:
     *                 type: string
     *               dateOfBirth:
     *                 type: string
     *                 format: date
     *     responses:
     *       200:
     *         description: Student updated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     student: { $ref: '#/components/schemas/Student' }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — not your school
     *       404:
     *         description: Student not found
     */
    async updateStudent({ __token, __schoolAdmin, id, firstName, lastName, email, dateOfBirth }) {
        const result = await this.validators.student.updateStudent({ id, firstName, lastName, email });
        if (result) return result;

        const student = await this.mongomodels.Student.findById(id);
        if (!student) return { error: 'Student not found' };

        if (student.school.toString() !== __token.school.toString()) {
            return { error: 'Access denied: student belongs to a different school' };
        }

        if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
            return { error: 'Invalid dateOfBirth format' };
        }

        if (firstName   !== undefined) student.firstName   = firstName;
        if (lastName    !== undefined) student.lastName    = lastName;
        if (email       !== undefined) student.email       = email || undefined;
        if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth || null;
        student.updatedAt = new Date();

        await student.save();
        return { student };
    }

    /**
     * @swagger
     * /api/student/transferStudent:
     *   put:
     *     summary: Transfer a student to a different classroom in the same school (school_admin only)
     *     tags: [Student]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [id, classroomId]
     *             properties:
     *               id:
     *                 type: string
     *                 description: Student ObjectId
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d4
     *               classroomId:
     *                 type: string
     *                 description: Target classroom ObjectId (must be in the same school)
     *                 example: 64f1a2b3c4d5e6f7a8b9c0d3
     *     responses:
     *       200:
     *         description: Student transferred
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:   { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     student: { $ref: '#/components/schemas/Student' }
     *       400:
     *         description: Validation error or target classroom in different school
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — not your school
     *       404:
     *         description: Student or classroom not found
     */
    async transferStudent({ __token, __schoolAdmin, id, classroomId }) {
        const result = await this.validators.student.transferStudent({ id, classroomId });
        if (result) return result;

        const student = await this.mongomodels.Student.findById(id);
        if (!student) return { error: 'Student not found' };

        if (student.school.toString() !== __token.school.toString()) {
            return { error: 'Access denied: student belongs to a different school' };
        }

        const classroom = await this.mongomodels.Classroom.findById(classroomId);
        if (!classroom) return { error: 'Target classroom not found' };

        if (classroom.school.toString() !== student.school.toString()) {
            return { error: 'Target classroom belongs to a different school' };
        }

        student.classroom = classroomId;
        student.updatedAt = new Date();
        await student.save();
        return { student };
    }

    /**
     * @swagger
     * /api/student/removeStudent:
     *   delete:
     *     summary: Remove a student (school_admin, own school only)
     *     tags: [Student]
     *     parameters:
     *       - in: query
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         example: 64f1a2b3c4d5e6f7a8b9c0d4
     *     responses:
     *       200:
     *         description: Student removed
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:      { type: boolean, example: true }
     *                 data:
     *                   type: object
     *                   properties:
     *                     message: { type: string, example: Student removed successfully }
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden — not your school
     *       404:
     *         description: Student not found
     */
    async removeStudent({ __token, __schoolAdmin, id }) {
        const result = await this.validators.student.removeStudent({ id });
        if (result) return result;

        const student = await this.mongomodels.Student.findById(id);
        if (!student) return { error: 'Student not found' };

        if (student.school.toString() !== __token.school.toString()) {
            return { error: 'Access denied: student belongs to a different school' };
        }

        await this.mongomodels.Student.findByIdAndDelete(id);
        return { message: 'Student removed successfully' };
    }
};
