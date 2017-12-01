var DocumentDBClient = require('documentdb').DocumentClient;
var async = require('async');

function TaskList(taskDao) {
    this.taskDao = taskDao;
}

TaskList.prototype = {
    showTasks: function (req, res) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.completed=@completed',
            parameters: [{
                name: '@completed',
                value: false
            }]
        };

        self.taskDao.find(querySpec, function (err, items) {
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

        self.taskDao.addUserObj(item, function (err) {
            if (err) {
                throw (err);
            }

            res.redirect('/');
        });
    },

    createRegId: function (req, res) {
        var self = this;
        var original = req.body;
        var item = req.body;
        var id = req.body.user.regId;
        self.taskDao.addCosmosItem(item, id, function (err) {
            if (err) {
                //throw (err);
                self.taskDao.updateCosmosItem(original, id, function (err) {
                    var i = 0;
                });
            }
            res.redirect('/');
        });
    },

    createKeyStore: function (req, res) {
        
        var self = this;
        var original = req.body;
        var item = req.body;
        var id = req.body.publicKey.regId;
        self.taskDao.createKeyStoreCosmos(item, id, function (err) {
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
            self.taskDao.updateItem(completedTask, function (err) {
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

module.exports = TaskList;
