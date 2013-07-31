RAD.view("view.start_page", RAD.Blanks.View.extend({
    url : 'source/views/start_page.html',

    events : {
        'tap .stat' : 'showStat'
    },

    children : [
        {
            container_id : '.graph',
            content : 'view.graphV3'
        },
        {
            container_id : '.list',
            content : 'view.task_list'
        }
    ],

    showStat : function(e){
        console.log(e);
        //if (e.originalEvent.swipe.direction === 'down') {
            this.publish('navigation.show', {
                content : 'view.stat',
                container_id : '#screen',
                backstack : true
            });
        //}
    },

    onReceiveMsg : function(c,d){
        if (typeof this[c.split('.')[2]] === 'function') {
            this[c.split('.')[2]]();
        }
    }
}));