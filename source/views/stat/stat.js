/**
 * @author: Metalmastery
 * @since: 30.07.13
 */
RAD.view("view.stat", RAD.Blanks.View.extend({
    url : 'source/views/stat/stat.html',
    children : [
        {
            container_id : '.graph',
            content : 'view.statGraph'
        },
        {
            container_id : '.bio_monitor',
            content : 'view.monitor'
        }
    ],
    onReceiveMsg : function(c,d){

    }
}));