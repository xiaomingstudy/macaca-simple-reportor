'use strict';

const fs = require('fs');
const path = require('path');
const EOL = require('os').EOL;
const mocha = require('mocha');
const _ = require('macaca-utils');
const inherits = require('util').inherits;

const Base = mocha.reporters.Base
const color = Base.color;

function Reporter(runner) {
    Base.call(this, runner);

    const that = this;
    const SEP_TOKEN = ',';
    const STEP_NAME = '\"stepName \":';
    const STEP_RESULT = '\"stepResult\" :';
    const SHOT_NAME = '\"shotName\" :';
    const ERROR_MESSAGE = '\"error_message\" :';

    let indents = 0;
    let n = 0;
    let resultLog = '';

    function indent() {
        return Array(indents).join('  ');
    }

    runner.on('start', function() {
        console.log('开始＋＋＋＋＋＋＋＋＋＋＋＋＋＋＋＋');
    });

    runner.on('suite', function(suite) {
        ++indents;
        console.log(color('suite', '%s%s'), indent(), suite.title);

        if (suite.root) {
            const filename = suite.suites[0].file;
            const filepath = path.basename(filename, '.test.js');
            const reportDir = path.join(process.cwd(), 'macaca-logs', filepath);
            _.mkdir(reportDir);
            _.mkdir(path.join(reportDir, 'screenshot'));
            resultLog = path.join(reportDir, 'result.json');
            fs.writeFileSync(resultLog, '');
            fs.appendFileSync(resultLog, '{\"Steps\":[');
        }
    });

    runner.on('suite end', function(suite) {
        --indents;
        if (indents === 1) {
            var script = fs.readFileSync(resultLog);
            var scriptText = script.toString();
            var ThisResultLog = scriptText.substring(0, scriptText.lastIndexOf('}') + 1);
            console.log('---', ThisResultLog);
            fs.writeFileSync(resultLog, ThisResultLog + ']}');
        }
    });

    runner.on('pending', function(test) {
        const fmt = indent() + color('pending', '  - %s');
        console.log(fmt, test.title);
    });

    runner.on('pass', function(test) {
        var stepScript = test.body.toString();

        var saveScreenshot = 'saveScreenshot';
        var regex = new RegExp(saveScreenshot, 'g');
        var result = stepScript.match(regex);
        var count = !result ? 0 : result.length;

        let fmt;

        if (test.speed === 'fast') {
            fmt = indent() +
                color('checkmark', '  ' + Base.symbols.ok) +
                color('pass', ' %s');
            console.log(fmt, test.title);
        } else {
            fmt = indent() +
                color('checkmark', '  ' + Base.symbols.ok) +
                color('pass', ' %s') +
                color(test.speed, ' (%dms)');
            console.log(fmt, test.title, test.duration);
        }
        var stepCountShot = '';
        var flage = 1;
        for (var i = 0; i < count; i++) {
            if (i == count) {
                stepCountShot += test.title + flage + '.png';
            } else {
                stepCountShot += test.title + +flage + '.png , ';
            }
            flage++;
        }
        if (stepCountShot == '' || stepCountShot == null) {
            stepCountShot = 'null'
        }
        fs.appendFileSync(resultLog, `{${STEP_NAME}"${test.title}"${SEP_TOKEN}${STEP_RESULT}true${SEP_TOKEN}${SHOT_NAME}"${stepCountShot}"},${EOL}`);
    });

    runner.on('fail', function(test, err) {
        console.log(indent() + color('fail', '  %d) %s'), ++n, test.title);
        fs.appendFileSync(resultLog, `{${STEP_NAME}"${test.title}"${SEP_TOKEN}${STEP_RESULT}false${SEP_TOKEN}${ERROR_MESSAGE}"${err.message.replace(/(?:\r\n|\r|\n)/g, ' ')}"},${EOL}`);
    });

    runner.on('end', that.epilogue.bind(that));
};

inherits(Reporter, Base);

module.exports = Reporter;