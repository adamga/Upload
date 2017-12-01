var DocumentDBClient = require('documentdb').DocumentClient;
var async = require('async');

function PublicKeyList(publicKeyDao) {
    this.publicKeyDao = publicKeyDao;
}

PublicKeyList.prototype = {

    showKeys: function (req, res) {
        var self = this;
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [{
                name: '@id',
                value: req.query.m_regId
            }]
        };

        self.publicKeyDao.find(querySpec, function (err, items) {
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

    saveChat: function (req, res) {

        var self = this;
        var item = req.body;
        var id = req.body.chat.regId;
        try {
            //throw (err);
            self.publicKeyDao.updateCosmosChat(item, id, function (err) {
                var i = 0;
            });
        } catch (err) { }

        res.redirect('/');
    },

    getChat: function (req, res) {
        
        var self = this;
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [{
                name: '@id',
                value: req.query.m_regId
            }]
        };

        self.publicKeyDao.find(querySpec, function (err, items) {
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

    getChats: function (req, res) {
        var self = this;
        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [{
                name: '@id',
                value: req.query.m_regId
            }]
        };

        self.publicKeyDao.find(querySpec, function (err, items) {
            if (err) {
                throw (err);
            }
            if (items.length > 0) {
                try {
                    res.send(items[0].chats);
                } catch (err) {
                    res.send({});
                }
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

        self.publicKeyDao.find(querySpec, function (err, items) {
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

        self.publicKeyDao.addUserObj(item, function (err) {
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
        item.chats = [];
        var id = req.body.result.regId;
        self.publicKeyDao.addCosmosItem(item, id, function (err) {
            if (err) {
                //throw (err);
                self.publicKeyDao.updateCosmosItem(original, id, function (err) {
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
        self.publicKeyDao.createKeyStoreCosmos(item, id, function (err) {
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
            self.publicKeyDao.updateItem(completedTask, function (err) {
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

module.exports = PublicKeyList;
