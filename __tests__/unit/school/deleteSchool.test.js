'use strict';

const { makeMockSchool, buildManager } = require('./helpers');

describe('SchoolManager.deleteSchool', () => {
    let manager, validators, mongomodels;

    beforeEach(() => {
        ({ manager, validators, mongomodels } = buildManager());
    });

    it('returns validation errors without hitting the DB', async () => {
        const validationError = { errors: ['id is required'] };
        validators.school.deleteSchool.mockResolvedValue(validationError);

        const result = await manager.deleteSchool({ __token: {}, __superadmin: true, id: '' });

        expect(result).toBe(validationError);
        expect(mongomodels.School.findById).not.toHaveBeenCalled();
    });

    it('returns error when school is not found', async () => {
        mongomodels.School.findById.mockResolvedValue(null);

        const result = await manager.deleteSchool({ __token: {}, __superadmin: true, id: 'nonexistent-id' });

        expect(result).toEqual({ error: 'School not found' });
        expect(mongomodels.School.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('deletes all students and classrooms in the school', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.findById.mockResolvedValue(mockSchool);
        mongomodels.Student.deleteMany.mockResolvedValue({});
        mongomodels.Classroom.deleteMany.mockResolvedValue({});
        mongomodels.User.updateMany.mockResolvedValue({});
        mongomodels.School.findByIdAndDelete.mockResolvedValue({});

        await manager.deleteSchool({ __token: {}, __superadmin: true, id: 'school-id-123' });

        expect(mongomodels.Student.deleteMany).toHaveBeenCalledWith({ school: 'school-id-123' });
        expect(mongomodels.Classroom.deleteMany).toHaveBeenCalledWith({ school: 'school-id-123' });
    });

    it('unassigns all school_admins from the school', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.findById.mockResolvedValue(mockSchool);
        mongomodels.Student.deleteMany.mockResolvedValue({});
        mongomodels.Classroom.deleteMany.mockResolvedValue({});
        mongomodels.User.updateMany.mockResolvedValue({});
        mongomodels.School.findByIdAndDelete.mockResolvedValue({});

        await manager.deleteSchool({ __token: {}, __superadmin: true, id: 'school-id-123' });

        expect(mongomodels.User.updateMany).toHaveBeenCalledWith(
            { school: 'school-id-123' },
            { $set: { school: null } }
        );
    });

    it('calls findByIdAndDelete on the correct id', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.findById.mockResolvedValue(mockSchool);
        mongomodels.Student.deleteMany.mockResolvedValue({});
        mongomodels.Classroom.deleteMany.mockResolvedValue({});
        mongomodels.User.updateMany.mockResolvedValue({});
        mongomodels.School.findByIdAndDelete.mockResolvedValue({});

        await manager.deleteSchool({ __token: {}, __superadmin: true, id: 'school-id-123' });

        expect(mongomodels.School.findByIdAndDelete).toHaveBeenCalledWith('school-id-123');
    });

    it('returns success message after deletion', async () => {
        const mockSchool = makeMockSchool();
        mongomodels.School.findById.mockResolvedValue(mockSchool);
        mongomodels.Student.deleteMany.mockResolvedValue({});
        mongomodels.Classroom.deleteMany.mockResolvedValue({});
        mongomodels.User.updateMany.mockResolvedValue({});
        mongomodels.School.findByIdAndDelete.mockResolvedValue({});

        const result = await manager.deleteSchool({ __token: {}, __superadmin: true, id: 'school-id-123' });

        expect(result).toEqual({ message: 'School deleted successfully' });
    });
});
