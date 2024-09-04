module.exports = {
    apps: [{
        name: 'bustransback',
        script: 'dist/src/main.js',
        instances: 0,
        exec_mode: 'cluster',
        wait_ready: true,
        kill_timeout: 5000,
    }, ],
};