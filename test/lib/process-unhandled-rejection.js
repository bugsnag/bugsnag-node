var bugsnag = require("../../"),
    Notification = require("../../lib/notification"),
    sinon = require("sinon");

bugsnag.register("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", {
  autoNotifyUnhandledRejection: process.env.NOTIFY_UNHANDLED_REJECTION !== 'no'
});

var deliverStub = sinon.stub(Notification.prototype, "_deliver").yields(null, {});
process.on("exit", function (code) {
    process.send({
        deliverCalled: deliverStub.called,
        payload: deliverStub.firstCall.thisValue
    });
});

Promise.reject(new Error("boom"));
