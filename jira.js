/**
 * Created by Goga- on 09-Jun-17.
 */
const fs = require("fs");
const restler = require("restler");
const debug = true;
const Client = require('node-rest-client').Client;
const client = new Client();
// Provide user credentials, which will be used to log in to JIRA.

const Jira = {
    client: client,
    url: "https://whalesoft.atlassian.net/rest/",
    session: null,
    username: null,
    trackingIssue: null,
    trackingComment: '',
    login: function(username, password, callback) {
        var that = this;
        var loginArgs = {
            data: {
                "username": username,
                "password": password
            },
            headers: {
                "Content-Type": "application/json"
            }
        };
        that.username = username;
        that.client.post(that.url+"auth/1/session", loginArgs, function(data, response){
            // console.log(response);
            if (response.statusCode == 200) {
                if(debug) console.log('succesfully logged in, session:', data.session);
                that.session = data.session;
                if( callback) callback.bind(that)();
            }
            else {
                throw "Login failed :(";
            }
        });
    },
    getIssues: function(jql, callback) {
        var that = this;
        // Get the session information and store it in a cookie in the header
        var searchArgs = {
            headers: {
                // Set the cookie from the session information
                cookie: that.session.name + '=' + that.session.value,
                "Content-Type": "application/json"
            },
            data: {
                // Provide additional data for the JIRA search. You can modify the JQL to search for whatever you want.
                jql: jql,
                maxResults: 5
            }
        };
        // Make the request return the search results, passing the header information including the cookie.
        that.client.post(that.url+"api/2/search", searchArgs, function(searchResult, response) {
            if(debug) console.log('status code:', response.statusCode);
            // if(debug) console.log('search result:', searchResult);
            if( callback) callback.bind(that)(searchResult);
        });
    },
    getStatuses: function(callback) {
        var that = this;
        var searchArgs = {
            headers: {
                cookie: that.session.name + '=' + that.session.value,
                "Content-Type": "application/json"
            },
            data: {
            }
        };
        that.client.get(that.url+"api/2/status", searchArgs, function(searchResult, response) {
            if( callback) callback.bind(that)(searchResult);
        });
    },
    getPriorities: function(callback) {
        var that = this;
        var searchArgs = {
            headers: {
                cookie: that.session.name + '=' + that.session.value,
                "Content-Type": "application/json"
            },
            data: {
            }
        };
        that.client.get(that.url+"api/2/priority", searchArgs, function(searchResult, response) {
            if( callback) callback.bind(that)(searchResult);
        });
    },
    getProjects: function(callback) {
        var that = this;
        var searchArgs = {
            headers: {
                cookie: that.session.name + '=' + that.session.value,
                "Content-Type": "application/json"
            },
            data: {
            }
        };
        that.client.get(that.url+"api/2/project", searchArgs, function(searchResult, response) {
            if( callback) callback.bind(that)(searchResult);
        });
    },
    addComment: function(comment, callback) {
        var that = this;
        var searchArgs = {
            headers: {
                cookie: that.session.name + '=' + that.session.value,
                "Content-Type": "application/json"
            },
            data: {
                "body": comment,
                "visibility": {
                    "type": "role",
                    "value": "Administrators"
                }
            }
        };
        that.client.post(that.url+"api/2/issue/"+that.trackingIssue+"/comment", searchArgs, function(searchResult, response) {
            if( callback) callback.bind(that)(searchResult);
        });
    },
    addWorkLog: function(screenshot, callback) {
        var that = this;
        if(screenshot.duration < 60) return;
        if(screenshot.status !== "removed") {
            fs.stat(screenshot.path, function (err, stats) {
                restler.post("http://whalesoft.com.ua/vs/tracker-save-image", {
                    multipart: true,
                    data: {
                        "folder_id": "0",
                        "filename": restler.file(screenshot.path, null, stats.size, null, "image/png")
                    }
                }).on("complete", function (data) {
                    if (debug) console.log(data);
                    let wurl = 'http://whalesoft.com.ua/' + data;
                    var searchArgs = {
                        headers: {
                            cookie: that.session.name + '=' + that.session.value,
                            "Content-Type": "application/json"
                        },
                        data: {
                            "comment": that.trackingComment + ' \\\\ [!' + wurl + '|width=300!|' + wurl + ']',
                            "visibility": {
                                "type": "role",
                                "value": "Administrators"
                            },
                            "started": screenshot.start,
                            "timeSpentSeconds": screenshot.duration
                        }
                    };

                    that.client.post(that.url + "api/2/issue/" + that.trackingIssue + "/worklog", searchArgs, function (searchResult, response) {
                        if(debug) console.log(response);
                        if (callback) callback.bind(that)(searchResult);
                    });
                });
            });
        }else{
            var searchArgs = {
                headers: {
                    cookie: that.session.name + '=' + that.session.value,
                    "Content-Type": "application/json"
                },
                data: {
                    "comment": that.trackingComment,
                    "visibility": {
                        "type": "role",
                        "value": "Administrators"
                    },
                    "started": "2017-06-08T11:22:20.352+0000",
                    "timeSpentSeconds": screenshot.duration
                }
            };

            that.client.post(that.url + "api/2/issue/" + that.trackingIssue + "/worklog", searchArgs, function (searchResult, response) {
                if(debug) console.log(response);
                if (callback) callback.bind(that)(searchResult);
            });
        }
    },
    getWorklog: function(callback){
        let that = this;
        var searchArgs = {
            headers: {
                cookie: that.session.name + '=' + that.session.value,
                "Content-Type": "application/json"
            },
            data: {
            }
        };
        that.client.get(that.url+"api/2/issue/"+that.trackingIssue+"/worklog", searchArgs, function(searchResult, response) {
            if(callback) callback.bind(that)(searchResult);
        });
    }
};
module.exports = Jira;