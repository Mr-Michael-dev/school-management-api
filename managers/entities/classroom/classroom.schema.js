module.exports = {
    createClassroom: [
        { model: 'longText', path: 'name', required: true },
    ],
    getClassroom: [
        { model: 'id', required: true },
    ],
    updateClassroom: [
        { model: 'id',                     required: true  },
        { model: 'longText', path: 'name', required: false },
    ],
    deleteClassroom: [
        { model: 'id', required: true },
    ],
};
