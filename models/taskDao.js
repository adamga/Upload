﻿var DocumentDBClient = require('documentdb').DocumentClient;
var docdbUtils = require('./docdbUtils');
function TaskDao(documentDBClient, databaseId, collectionId) {
    this.client = documentDBClient;
    this.databaseId = databaseId;
    this.collectionId = collectionId;

    this.database = null;
    this.collection = null;
}

TaskDao.prototype = {
    init: function (callback) {
        var self = this;

        docdbUtils.getOrCreateDatabase(self.client, self.databaseId, function (err, db) {
            if (err) {
                callback(err);
            }

            self.database = db;
            docdbUtils.getOrCreateCollection(self.client, self.database._self, self.collectionId, function (err, coll) {
                if (err) {
                    callback(err);
                }
                self.collection = coll;
            });
        });
    },

    find: function (querySpec, callback) {
        var self = this;

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);
            } else {
                callback(null, results);
            }
        });
    },

    addItem: function (item, callback) {
        var self = this;
        item.date = Date.now();
        item.completed = false;
        self.client.createDocument(self.collection._self, item, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    },



    addCosmosItem: function (item, id, callback) {
        //
        var self = this;
        item.date = Date.now();
        item.id = id;
        item.completed = false;
        self.client.createDocument(self.collection._self, item, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    },

    createKeyStoreCosmos: function (item, id, callback) {
        
        var self = this;
        item.date = Date.now();
        item.id = id;
        item.completed = false;

        self.client.createDocument(self.collection._self, item, function (err, doc) {
            if (err) {
                
                callback(err);
            } else {
                
                callback(null);
            }
        });
    },

    addUserObj: function (item, callback) {
        var self = this;
        item.date = Date.now();
        item.completed = false;
        self.client.createDocument(self.collection._self, item, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                callback(null);
            }
        });
    },

    updateCosmosItem: function (item, itemId, callback) {
        var self = this;
        self.getItem(itemId, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                if (typeof (doc) != "undefined") {
                    doc.completed = true;

                    var docLink = 'dbs/' + self.database.id + '/colls/' + self.collection.id + '/docs/' + item.id;
                    self.client.replaceDocument(docLink, item, function (err, replaced) {
                        if (err) {

                            callback(err);
                        } else {

                            callback(null);
                        }
                    });
                } 
            }
        });
    },

    updateItem: function (itemId, callback) {
        var self = this;

        self.getItem(itemId, function (err, doc) {
            if (err) {
                callback(err);
            } else {
                doc.completed = true;
                self.client.replaceDocument(doc._self, doc, function (err, replaced) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            }
        });
    },

    getItem: function (itemId, callback) {
        var self = this;

        var querySpec = {
            query: 'SELECT * FROM root r WHERE r.id=@id',
            parameters: [{
                name: '@id',
                value: itemId
            }]
        };

        self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
            if (err) {
                callback(err);
            } else {
                callback(null, results[0]);
            }
        });
    }
};

module.exports = TaskDao;