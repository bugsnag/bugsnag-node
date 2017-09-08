var bugsnag = require("../../"),
    Notification = require("../../lib/notification"),
    sinon = require("sinon");

bugsnag.register("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

var deliverStub = sinon.stub(Notification.prototype, "_deliver").yields(null, {});
process.on("exit", function (code) {
    process.send({
        deliverCalled: deliverStub.called,
        payload: deliverStub.firstCall.thisValue
    });
});

throw new Error("Boom");
