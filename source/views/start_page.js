RAD.view("view.start_page", RAD.Blanks.View.extend({
    url : 'source/views/start_page.html',
    children : [
        {
            container_id : '.graph',
            content : 'view.graph'
        },
        {
            container_id : '.list',
            content : 'view.task_list'
        }
    ],
    onReceiveMsg : function(c,d){
        if (typeof this[c.split('.')[2]] === 'function') {
            this[c.split('.')[2]]();
        }
    },
    hello : function(){
        console.log('hello');

    }
}));