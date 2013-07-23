RAD.application = function (core) {
    'use strict';

    var app = this;

    app.start = function () {
        var options = {
            container_id: '#screen',
            content: "view.start_page",
            animation: "none"
        };
        core.publish('navigation.show', options);
        core.publish('view.redactor', {autocreate: true});
    };

    return app;
};

