function config(req, res, next) {
    res.header('access-control-allow-origin', '*');
    res.header('access-control-allow-methods', 'GET, PUT, POST, DELETE');
    res.header('access-control-allow-headers', 'x-requested-with, content-type, authorization, total-file-size-bytes');
    res.header('access-control-allow-credentials', true);
    res.header('strict-transport-security', 'max-age=63072000; includeSubDomains; preload');
    next();
}

module.exports = {
    config
}
