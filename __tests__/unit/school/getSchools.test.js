'use strict';

const { makeMockSchool, buildManager } = require('./helpers');

describe('SchoolManager.getSchools', () => {
    let manager, mongomodels;

    beforeEach(() => {
        ({ manager, mongomodels } = buildManager());
    });

    it('returns all schools with admins populated', async () => {
        const mockSchools = [makeMockSchool(), makeMockSchool({ _id: 'school-id-456', name: 'Second School' })];
        mongomodels.School.find.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockSchools),
        });

        const result = await manager.getSchools({ __token: {}, __superadmin: true });

        expect(mongomodels.School.find).toHaveBeenCalled();
        expect(result).toEqual({ schools: mockSchools });
    });
});
