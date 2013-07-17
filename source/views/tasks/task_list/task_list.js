/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 3:18 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.task_list", RAD.Blanks.View.extend({
    url : 'source/views/tasks/task_list/task_list.html',

    events: {
        'swipe .task' : 'removeTask',
        'swipe .task_list' : 'createRedactor',
        'click .task' : 'changeRedactor'

    },

    onInitialize : function(){
        this.model = RAD.model('task_list');
    },

    removeTask : function(e){
        console.log('tap', e);

        var direction = e.originalEvent.swipe.direction;
        if (direction === "left" && e.originalEvent.swipe.speed > 0) {
            this.model.remove($(e.currentTarget).data('model-id'));
            this.publish('service.storage.save');
        }
    },

    createRedactor : function(e){
        console.log('create');
        console.log(e);
        e.originalEvent.stopPropagation();
        var direction = e.originalEvent.swipe.direction;
        if (direction === "right" && e.originalEvent.swipe.speed > 0) {
            this.publish('navigation.popup.show', {
                content : 'view.redactor',
                width: 180,
                height: 80,
                target: document.body,
                gravity: 'center'
            });
        }
    },

    changeRedactor : function(e){
        console.log('change');
        var id = $(e.target).data('model-id');
        this.publish('navigation.popup.show', {
            content : 'view.redactor',
            width: 180,
            height: 80,
            target: document.body,
            gravity: 'center',
            extras: id
        });

    },

    preventClick : function(){
        e.stopPropagation();
        e.preventDefault();
        return false;
    }

}));
