var DocumentDBClient = require('documentdb').DocumentClient;
var async = require('async');

function UsersList(usersDao) {
    this.usersDao = usersDao;
}

UsersList.prototype = {

    showKeys: function (req, res) {
        var self = this;
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [{
                name: '@id',
                value: req.query.m_regId
            }]
        };

        self.usersDao.find(querySpec, function (err, items) {
            if (err) {
                throw (err);
            }
            if (items.length > 0) {
                res.send(items[0].result);
            } else {
                var result = {};
                res.send(result);
            }
        });
    },

    showTasks: function (req, res) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.completed=@completed',
            parameters: [{
                name: '@completed',
                value: false
            }]
        };

        self.usersDao.find(querySpec, function (err, items) {
            if (err) {
                throw (err);
            }

            res.render('index', {
                title: 'My ToDo List ',
                tasks: items
            });
        });
    },

    testTask: function (req, res) {
        var i = 0;
        
    },

    addTask: function (req, res) {
        var self = this;
        var item = req.body;

        self.usersDao.addUserObj(item, function (err) {
            if (err) {
                throw (err);
            }

            res.redirect('/');
        });
    },

    createUser: function (req, res) {
        var self = this;
        var original = req.body;
        var item = req.body;
        var id = req.body.user.regId;
        self.usersDao.addCosmosItem(item, id, function (err) {
            if (err) {
                //throw (err);
                self.usersDao.updateCosmosItem(original, id, function (err) {
                    var i = 0;
                });
            }
            res.redirect('/');
        });
    },

    getAllUsers: function (req, res) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r'
        };
        self.usersDao.find(querySpec, function (err, items) {
            if (err) {
                throw (err);
            }
            res.send(items);
        });
    },

    createKeyStore: function (req, res) {
        
        var self = this;
        var original = req.body;
        var item = req.body;
        var id = req.body.publicKey.regId;
        self.usersDao.createKeyStoreCosmos(item, id, function (err) {
            if (err) {
                throw (err);
            }
            res.redirect('/');
        });
    },

    completeTask: function (req, res) {
        var self = this;
        var completedTasks = Object.keys(req.body);

        async.forEach(completedTasks, function taskIterator(completedTask, callback) {
            self.usersDao.updateItem(completedTask, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        }, function goHome(err) {
            if (err) {
                throw err;
            } else {
                res.redirect('/');
            }
        });
    }
};

module.exports = UsersList;
