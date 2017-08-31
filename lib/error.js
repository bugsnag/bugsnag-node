"use strict";

var stacktrace = require("stack-trace"),
    fs = require('fs'),
    Promise = require('promise'),
    Utils = require("./utils"),
    Configuration = require("./configuration");

function loadCode (error, callback) {
    var padding = 4; // Padding of either side of the frame's line (4 actually means 3...)

    Promise.all(error.stacktrace.map(function (frame) {
        if (frame.inProject) {
            return new Promise(function (resolve) {
                fs.readFile(frame.path, function (err, data) {
                    if ( ! err) {
                        var fileLines = data.toString().split('\n');

                        frame.code = {};

                        for (var i = frame.lineNumber - padding; i < (frame.lineNumber - 1) + padding; i++) {
                            if (typeof fileLines[i] === 'string') {
                                frame.code[i + 1] = fileLines[i];
                            }
                        }
                    }

                    resolve();
                });
            });
        }
    })).then(callback);
}

function processCallSites (callSites) {
    return callSites.map(function(callSite) {
        var frame, _ref;
        frame = {
           file: callSite.getFileName(),
           path: callSite.getFileName(),
           method: callSite.getMethodName() || callSite.getFunctionName() || "none",
           lineNumber: callSite.getLineNumber(),
           columnNumber: callSite.getColumnNumber()
        };

        if (Configuration.projectRoot && frame.file && frame.file.indexOf(Configuration.projectRoot) === 0) {
            frame.inProject = callSite.getFileName().indexOf("node_modules") === -1;
            if (!frame.inProject) {
                delete frame.inProject;
            }
            frame.file = frame.file.substr(Configuration.projectRoot.length + 1);
        }
        return frame;
    });
}

function Error(error, errorClass) {
    var callSites;
    if (Utils.typeOf(error) === "string") {
        this.message = error;
        this.errorClass = errorClass || "Error";
    } else if (error) {
        this.message = error.message;
        this.errorClass = errorClass || error.name || error.constructor.name || "Error";
    } else {
        this.message = "[unknown]";
        this.errorClass = errorClass || "Error";
    }
    callSites = stacktrace.parse(error);
    if (callSites.length === 0) {
        callSites = stacktrace.get();
    }
    this.stacktrace = processCallSites(callSites, Configuration.projectRoot);
}

Error.prototype.loadCode = function (callback) {
    loadCode(this, callback);
};

Error.buildErrors = function(error, errorClass) {
    var returnArray;
    returnArray = [new module.exports(error, errorClass)];
    if (error.oauthError) {
        returnArray.push(new module.exports(error.oauthError));
    }
    return returnArray;
};


module.exports = Error;
