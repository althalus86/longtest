var colors = require('colors'),
    cron = require('cron'),
    now = require("performance-now"),
    request = require('request'),
    moment = require('moment'),
    fs = require('graceful-fs'),
    config = require('./config.js');

var cronJobs = [];

var configDefaults = {
    timeFormat: 'MMM D YYYY, H:mm:ss',
    paint: true, //true, false, errorOnly
    save: true, //true, false, errorOnly
    outfile: 'logs.log'
};

for (var att in configDefaults) {
    if (undefined == config[att]) {
        config[att] = configDefaults[att];
    }
}

function opt(job) {
    var options = {
        port: 80,
        method: 'GET',
        accept: '*/*'
    };
    for (var att in job) {
        options[att] = job[att];
    }
    return options;
}

function startCron(job) {
    var number = cronJobs.length;
    cronJobs[number] = cron.job(job.cron, function () {
        var t1 = now();
        request(opt(job), function (error) {
            if (undefined != error) {
                save(Math.round(now() - t1), job.url + " - (" + error.toString() + ")", 1);
                return paint(Math.round(now() - t1), job.url + " - (" + error.toString() + ")", 1);
            }
            if (config.paint) paint(Math.round(now() - t1), job.url, job.threshold);
            if (config.save) save(Math.round(now() - t1), job.url, job.threshold);
        });
    });
    cronJobs[number].start();
}

function paint(time, URL, threshold) {
    var datetime = moment().format(config.timeFormat);
    if (threshold < time) return console.warn(datetime.red + ' hitting: '.red + URL.red.bold, " - [" + (time + "").red.bold + "]");
    if (config.paint != "errorOnly") console.warn(datetime.grey + ' hitting: '.grey + URL.yellow, " - [" + (time + "").yellow + "]");
}

function save(time, URL, threshold) {
    var datetime = moment().format(config.timeFormat);
    var message = datetime + ' hitting: ' + URL + " - [" + time + "]" + '\r\n';

    if (threshold < time) {
        fs.appendFile(config.outfile, "ERROR:: " + message, function (err) {
            if (undefined != err) return console.warn('Error'.red.bold, err.toString());
        });
    } else if (config.save != "errorOnly") {
        fs.appendFile(config.outfile, message, function (err) {
            if (undefined != err) return console.warn('Error'.red.bold, err.toString());
        });
    }
}

function start(err) {
    if (err) return console.error(err);
    config.jobs.forEach(startCron);
}

(config.save) ? fs.open(config.outfile, 'a', start) : start();
