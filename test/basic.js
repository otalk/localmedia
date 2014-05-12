var test = require('tape');
var localMedia = require('../index');

test('test localStream and ended event', function (t) {
    var media = new localMedia();
    media.on('localStream', function (stream) {
        t.pass('got local stream');
    });
    media.startLocalMedia(null, function (err, stream) {
        if (err) {
            t.fail('startLocalMedia failed', err);
            return;
        }
        stream.addEventListener('ended', function (event) {
            t.end();
        });
        console.log('tracks', stream.getAudioTracks().length, stream.getVideoTracks().length);
        stream.stop();
    });
});

// check constraints are working as intended
test('test audioonly stream', function (t) {
    var media = new localMedia();
    media.on('localStream', function (stream) {
        t.pass('got local stream');
        if (stream.getAudioTracks().length > 0) {
            t.pass('got audio track');
        } else {
            t.fail('got no audio track');
        }
        if (stream.getVideoTracks().length === 0) {
            t.pass('got no video track');
        } else {
            t.fail('got video track');
        }
    });
    media.startLocalMedia({audio: true, video: false}, function (err, stream) {
        if (err) {
            t.fail('startLocalMedia failed', err);
            return;
        }
        stream.addEventListener('ended', function (event) {
            t.end();
        });
        stream.stop();
    });
});
test('test videoonly stream', function (t) {
    var media = new localMedia();
    media.on('localStream', function (stream) {
        t.pass('got local stream');
        if (stream.getAudioTracks().length === 0) {
            t.pass('got no audio track');
        } else {
            t.fail('got audio track');
        }
        if (stream.getVideoTracks().length > 0) {
            t.pass('got no video track');
        } else {
            t.fail('got no video track');
        }
    });
    media.startLocalMedia({audio: false, video: true}, function (err, stream) {
        if (err) {
            t.fail('startLocalMedia failed', err);
            return;
        }
        stream.addEventListener('ended', function (event) {
            t.end();
        });
        stream.stop();
    });
});
