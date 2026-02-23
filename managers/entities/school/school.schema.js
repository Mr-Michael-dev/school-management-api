module.exports = {
    createSchool: [
        { model: 'longText', path: 'name',    required: true  },
        { model: 'longText', path: 'address', required: true  },
    ],
    getSchool: [
        { model: 'id', required: true },
    ],
    updateSchool: [
        { model: 'id',                        required: true  },
        { model: 'longText', path: 'name',    required: false },
        { model: 'longText', path: 'address', required: false },
    ],
    deleteSchool: [
        { model: 'id', required: true },
    ],
    assignAdmin: [
        { model: 'id', path: 'schoolId', required: true },
        { model: 'id', path: 'userId',   required: true },
    ],
    removeAdmin: [
        { model: 'id', path: 'schoolId', required: true },
        { model: 'id', path: 'userId',   required: true },
    ],
};
