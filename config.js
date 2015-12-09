exports.jobs = [
    {
        url: 'https://www.google.com.mt',
        method: 'GET',
        cron: "*/1 * * * * *",
		rejectUnauthorized: false,
        threshold: 500
    }
];
exports.save = "errorOnly";

