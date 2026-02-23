module.exports = {
    login: [
        { model: 'email',    required: true },
        { model: 'password', required: true },
    ],
    createUser: [
        { model: 'username',                 required: true  },
        { model: 'email',                    required: true  },
        { model: 'password',                 required: true  },
        { model: 'longText', path: 'role',   required: false },
        { model: 'id',       path: 'school', required: false },
    ],
    getUser: [
        { model: 'id', required: true },
    ],
    updateUser: [
        { model: 'id',                       required: true  },
        { model: 'username',                 required: false },
        { model: 'email',                    required: false },
        { model: 'longText', path: 'role',   required: false },
    ],
    deleteUser: [
        { model: 'id', required: true },
    ],
    // getUsers has no body params — no validator entry needed
};
