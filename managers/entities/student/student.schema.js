module.exports = {
    enrollStudent: [
        { model: 'longText', path: 'firstName',   required: true  },
        { model: 'longText', path: 'lastName',    required: true  },
        { model: 'email',                         required: false },
        { model: 'id',       path: 'classroomId', required: true  },
    ],
    getStudent: [
        { model: 'id', required: true },
    ],
    updateStudent: [
        { model: 'id',                             required: true  },
        { model: 'longText', path: 'firstName',   required: false },
        { model: 'longText', path: 'lastName',    required: false },
        { model: 'email',                         required: false },
    ],
    transferStudent: [
        { model: 'id',                             required: true  },
        { model: 'id',       path: 'classroomId', required: true  },
    ],
    removeStudent: [
        { model: 'id', required: true },
    ],
};
