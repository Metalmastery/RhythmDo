(function (document, window) {
    'use strict';

    var scripts = [

        "source/libs/iscroll-lite.js",

        "source/application/application.js",

        "source/views/start_page.js",
        "source/views/graph/graph.js",
        "source/views/graphV2/graphV2.js",
        "source/views/graphV3/graphV3.js",
        "source/views/tasks/task/task.js",
        "source/views/tasks/task_list/task_list.js",
        "source/views/tasks/groups/group.js",
        "source/views/tasks/redactor/redactor.js",

        "source/services/storage.js",

        "source/models/task.js",
        "source/models/task_list.js"
    ];

    function onEndLoad() {

        var core = window.RAD.core,
            application = new window.RAD.application(core),
            coreOptions = {
                defaultBackstack: false,
                defaultAnimation: 'slide',
                animationTimeout: 3000,
                debug: false
            };

        //initialize core by new application object
        core.initialize(application, coreOptions);

        //start
        application.start();

        core.publish('service.storage.restore');
    }

    window.RAD.scriptLoader.loadScripts(scripts, onEndLoad);
}(document, window));