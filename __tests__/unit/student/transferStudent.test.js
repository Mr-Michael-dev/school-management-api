'use strict';

const { makeMockStudent, makeMockClassroom, buildManager } = require('./helpers');

describe('StudentManager.transferStudent', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['classroomId is required'] };
        validators.student.transferStudent.mockResolvedValue(validationError);

        const result = await manager.transferStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', classroomId: '',
        });

        expect(result).toBe(validationError);
        expect(mongomodels.Student.findById).not.toHaveBeenCalled();
    });

    it('returns error when student is not found', async () => {
        mongomodels.Student.findById.mockResolvedValue(null);

        const result = await manager.transferStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'nonexistent-id', classroomId: 'classroom-id-456',
        });

        expect(result).toEqual({ error: 'Student not found' });
        expect(mongomodels.Classroom.findById).not.toHaveBeenCalled();
    });

    it('returns error when student belongs to a different school', async () => {
        const mockStudent = makeMockStudent({ school: { toString: () => 'other-school-id' } });
        mongomodels.Student.findById.mockResolvedValue(mockStudent);

        const result = await manager.transferStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', classroomId: 'classroom-id-456',
        });

        expect(result).toEqual({ error: 'Access denied: student belongs to a different school' });
        expect(mongomodels.Classroom.findById).not.toHaveBeenCalled();
    });

    it('returns error when target classroom is not found', async () => {
        mongomodels.Student.findById.mockResolvedValue(makeMockStudent());
        mongomodels.Classroom.findById.mockResolvedValue(null);

        const result = await manager.transferStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', classroomId: 'nonexistent-classroom',
        });

        expect(result).toEqual({ error: 'Target classroom not found' });
    });

    it('returns error when target classroom belongs to a different school', async () => {
        mongomodels.Student.findById.mockResolvedValue(makeMockStudent());
        mongomodels.Classroom.findById.mockResolvedValue(
            makeMockClassroom({ school: { toString: () => 'other-school-id' } })
        );

        const result = await manager.transferStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', classroomId: 'classroom-id-456',
        });

        expect(result).toEqual({ error: 'Target classroom belongs to a different school' });
    });

    it('updates student classroom and sets updatedAt on success', async () => {
        const mockStudent = makeMockStudent();
        mongomodels.Student.findById.mockResolvedValue(mockStudent);
        mongomodels.Classroom.findById.mockResolvedValue(makeMockClassroom({ _id: 'classroom-id-456' }));

        await manager.transferStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', classroomId: 'classroom-id-456',
        });

        expect(mockStudent.classroom).toBe('classroom-id-456');
        expect(mockStudent.updatedAt).toBeInstanceOf(Date);
        expect(mockStudent.save).toHaveBeenCalled();
    });

    it('returns the updated student', async () => {
        const mockStudent = makeMockStudent();
        mongomodels.Student.findById.mockResolvedValue(mockStudent);
        mongomodels.Classroom.findById.mockResolvedValue(makeMockClassroom({ _id: 'classroom-id-456' }));

        const result = await manager.transferStudent({
            __token: { school: 'school-id-123' }, __schoolAdmin: true,
            id: 'student-id-123', classroomId: 'classroom-id-456',
        });

        expect(result).toEqual({ student: mockStudent });
    });
});
