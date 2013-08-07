RAD.application = function (core) {
    'use strict';

    var app = this;

    app.bio = {
        birthDateTimestamp : null,
        birthDate : null,
        currentDay : null,
        getDaysFromBirth : function(date){
            "use strict";
            //var birth = new Date(app.bio.birthDate);
            var birth = app.bio.birthDate,
                currentDate = date || new Date();
            return (currentDate - birth)/86400000;
        },
        getBioForDay : function(date){
            "use strict";

            var periods = [23, 28, 33],
                day = [];
                //birth = new Date(app.bio.birthDate);
            var d = app.bio.getDaysFromBirth(date);
            for (var per in periods){
                day[per] = (Math.sin(2*Math.PI*d/periods[per]));
            }
            day[3] = date.getDate();
            day[4] = date.toDateString().split(' ')[0];
            day[5] = d;
            return day;
        }
    };

    app.start = function () {
        var options = {
            container_id: '#screen',
            content: "view.stat",
//            content: "view.start_page",
            animation: "none"
        };
        core.publish('navigation.show', options);
        core.publish('view.redactor', {autocreate: true});
    };

    return app;
};

