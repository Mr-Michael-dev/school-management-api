'use strict';

const { makeMockStudent, makeMockClassroom, buildManager } = require('./helpers');

describe('StudentManager.enrollStudent', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['firstName is required'] };
        validators.student.enrollStudent.mockResolvedValue(validationError);

        const result = await manager.enrollStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            firstName: '', lastName: 'Doe', classroomId: 'classroom-id-123',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.Classroom.findById).not.toHaveBeenCalled();
    });

    it('returns error when admin has no school assigned', async () => {
        const result = await manager.enrollStudent({
            __token: { school: null }, __schoolAdmin: true,
            firstName: 'John', lastName: 'Doe', classroomId: 'classroom-id-123',
        });

        expect(result).toEqual({ error: 'Admin is not assigned to any school' });
        expect(mongomodels.Classroom.findById).not.toHaveBeenCalled();
    });

    it('returns error when classroom is not found', async () => {
        mongomodels.Classroom.findById.mockResolvedValue(null);

        const result = await manager.enrollStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            firstName: 'John', lastName: 'Doe', classroomId: 'nonexistent-classroom',
        });

        expect(result).toEqual({ error: 'Classroom not found', code: 404 });
        expect(mongomodels.Student.create).not.toHaveBeenCalled();
    });

    it('returns error when classroom belongs to a different school', async () => {
        mongomodels.Classroom.findById.mockResolvedValue(
            makeMockClassroom({ school: { toString: () => 'other-school-id' } })
        );

        const result = await manager.enrollStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            firstName: 'John', lastName: 'Doe', classroomId: 'classroom-id-123',
        });

        expect(result).toEqual({ error: 'Classroom does not belong to your school' });
        expect(mongomodels.Student.create).not.toHaveBeenCalled();
    });

    it('returns error when a student with the same email already exists', async () => {
        mongomodels.Classroom.findById.mockResolvedValue(makeMockClassroom());
        mongomodels.Student.findOne.mockResolvedValue(makeMockStudent());

        const result = await manager.enrollStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            firstName: 'John', lastName: 'Doe',
            email: 'john.doe@student.com', classroomId: 'classroom-id-123',
        });

        expect(result).toEqual({ error: 'A student with this email already exists' });
        expect(mongomodels.Student.create).not.toHaveBeenCalled();
    });

    it('skips email duplicate check when no email is provided', async () => {
        const mockStudent = makeMockStudent({ email: undefined });
        mongomodels.Classroom.findById.mockResolvedValue(makeMockClassroom());
        mongomodels.Student.create.mockResolvedValue(mockStudent);

        await manager.enrollStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            firstName: 'John', lastName: 'Doe', classroomId: 'classroom-id-123',
        });

        expect(mongomodels.Student.findOne).not.toHaveBeenCalled();
        expect(mongomodels.Student.create).toHaveBeenCalled();
    });

    it('returns error when dateOfBirth is invalid', async () => {
        mongomodels.Classroom.findById.mockResolvedValue(makeMockClassroom());
        mongomodels.Student.findOne.mockResolvedValue(null);

        const result = await manager.enrollStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            firstName: 'John', lastName: 'Doe',
            classroomId: 'classroom-id-123', dateOfBirth: 'not-a-date',
        });

        expect(result).toEqual({ error: 'Invalid dateOfBirth format' });
        expect(mongomodels.Student.create).not.toHaveBeenCalled();
    });

    it('creates student with correct data and returns it', async () => {
        const mockStudent = makeMockStudent();
        mongomodels.Classroom.findById.mockResolvedValue(makeMockClassroom());
        mongomodels.Student.findOne.mockResolvedValue(null);
        mongomodels.Student.create.mockResolvedValue(mockStudent);

        const result = await manager.enrollStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            firstName: 'John', lastName: 'Doe',
            email: 'john.doe@student.com', dateOfBirth: '2010-05-14',
            classroomId: 'classroom-id-123',
        });

        expect(mongomodels.Student.create).toHaveBeenCalledWith({
            firstName:   'John',
            lastName:    'Doe',
            email:       'john.doe@student.com',
            dateOfBirth: '2010-05-14',
            school:      'school-id-123',
            classroom:   'classroom-id-123',
        });
        expect(result).toEqual({ student: mockStudent });
    });
});
