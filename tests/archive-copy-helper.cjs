const changes = require('../qa/archive-status/approved-copy-changes.json');
exports.beforeArchive = html => { for (const [before, after] of changes) { if (html.includes(after)) html = html.replace(after, before); } return html; };
