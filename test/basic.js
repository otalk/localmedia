var test = require('tape');
var LocalMedia = require('../localmedia');

/* tests are BROKEN in Firefox
 * since the tests rely on .onended
 * which is not called by Firefox
 * (and neither is .onended on any track called)
 */


test('test localStream and localStreamStopped event', function (t) {
    t.plan(2);

    var media = new LocalMedia();
    media.on('localStream', function (stream) {
        t.pass('got local stream', stream);
    });
    media.on('localStreamStopped', function(stream) {
        t.pass('local stream stopped', stream);
        t.end();
    });

    media.start(null, function (err, stream) {
        if (err) {
            t.fail('start failed', err);
            return;
        }

        stream.getTracks().forEach(function (track) { track.stop(); });
    });
});

// check constraints are working as intended
test('test audio-only stream', function (t) {
    t.plan(4);

    var media = new LocalMedia();
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
    media.on('localStreamStopped', function(stream) {
        t.pass('local stream stopped', stream);
        t.end();
    });

    media.start({audio: true, video: false}, function (err, stream) {
        if (err) {
            t.fail('start failed', err);
            return;
        }

        stream.getTracks().forEach(function (track) { track.stop(); });
    });
});
test('test video-only stream', function (t) {
    t.plan(4);

    var media = new LocalMedia();
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
    media.on('localStreamStopped', function(stream) {
        t.pass('local stream stopped', stream);
        t.end();
    });

    media.start({audio: false, video: true}, function (err, stream) {
        if (err) {
            t.fail('start failed', err);
            return;
        }

        stream.getTracks().forEach(function (track) { track.stop(); });
    });
});

test('test stop method', function (t) {
    t.plan(2);
    var media = new LocalMedia();
    media.on('localStream', function (stream) {
        t.pass('got local stream', stream);
    });
    media.on('localStreamStopped', function(stream) {
        t.pass('local stream stopped', stream);
        t.end();
    });

    media.start(null, function (err, stream) {
        if (err) {
            t.fail('start failed', err);
            return;
        }

        media.stop(stream);
    });
});
