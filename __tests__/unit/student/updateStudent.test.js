'use strict';

const { makeMockStudent, buildManager } = require('./helpers');

describe('StudentManager.updateStudent', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.student.updateStudent.mockResolvedValue(validationError);

        const result = await manager.updateStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: '',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.Student.findById).not.toHaveBeenCalled();
    });

    it('returns error when student is not found', async () => {
        mongomodels.Student.findById.mockResolvedValue(null);

        const result = await manager.updateStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true, id: 'nonexistent-id',
        });

        expect(result).toEqual({ error: 'Student not found' });
    });

    it('returns error when student belongs to a different school', async () => {
        const mockStudent = makeMockStudent({ school: { toString: () => 'other-school-id' } });
        mongomodels.Student.findById.mockResolvedValue(mockStudent);

        const result = await manager.updateStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', firstName: 'Jane',
        });

        expect(result).toEqual({ error: 'Access denied: student belongs to a different school' });
        expect(mockStudent.save).not.toHaveBeenCalled();
    });

    it('returns error when dateOfBirth is invalid', async () => {
        const mockStudent = makeMockStudent();
        mongomodels.Student.findById.mockResolvedValue(mockStudent);

        const result = await manager.updateStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', dateOfBirth: 'not-a-date',
        });

        expect(result).toEqual({ error: 'Invalid dateOfBirth format' });
        expect(mockStudent.save).not.toHaveBeenCalled();
    });

    it('updates firstName, lastName, email, and dateOfBirth when provided', async () => {
        const mockStudent = makeMockStudent();
        mongomodels.Student.findById.mockResolvedValue(mockStudent);

        await manager.updateStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123',
            firstName: 'Jane', lastName: 'Smith',
            email: 'jane.smith@student.com', dateOfBirth: '2011-03-20',
        });

        expect(mockStudent.firstName).toBe('Jane');
        expect(mockStudent.lastName).toBe('Smith');
        expect(mockStudent.email).toBe('jane.smith@student.com');
        expect(mockStudent.dateOfBirth).toBe('2011-03-20');
        expect(mockStudent.save).toHaveBeenCalled();
    });

    it('does not overwrite fields that are not provided', async () => {
        const mockStudent = makeMockStudent({ firstName: 'John', lastName: 'Doe' });
        mongomodels.Student.findById.mockResolvedValue(mockStudent);

        await manager.updateStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', firstName: 'Jane',
        });

        expect(mockStudent.firstName).toBe('Jane');
        expect(mockStudent.lastName).toBe('Doe');
    });

    it('sets updatedAt and returns updated student', async () => {
        const mockStudent = makeMockStudent();
        mongomodels.Student.findById.mockResolvedValue(mockStudent);

        const result = await manager.updateStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', firstName: 'Jane',
        });

        expect(mockStudent.updatedAt).toBeInstanceOf(Date);
        expect(result).toEqual({ student: mockStudent });
    });
});
