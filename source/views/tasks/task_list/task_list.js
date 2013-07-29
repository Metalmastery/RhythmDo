/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 3:18 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.task_list", RAD.Blanks.ScrollableView.extend({
    url : 'source/views/tasks/task_list/task_list.html',

    events: {
        'swipe .task' : 'removeTask',
        'swipe .groupTitle' : 'createRedactor',
        'tap .task' : 'changeRedactor'
    },

    children : [
        {
            content : 'view.group_brain',
            container_id : '#brain'
        },
        {
            content : 'view.group_emo',
            container_id : '#emo'
        },
        {
            content : 'view.group_strength',
            container_id : '#strength'
        },
        {
            content : 'view.group_today',
            container_id : '#today'
        },
        {
            content : 'view.group_tomorrow',
            container_id : '#tomorrow'
        },
        {
            content : 'view.group_week',
            container_id : '#week'
        }

    ],

    currentDay : 0,

    onInitialize : function(){
        this.model = RAD.model('task_list');

        this.subscribe('taskListRefresh', this.refreshScroll, this);

    },

    removeTask : function(e){
        var direction = e.originalEvent.swipe.direction;
        if (direction === "left" && e.originalEvent.swipe.speed > 0) {
            this.model.remove($(e.currentTarget).data('model-id'));
            this.publish('service.storage.save');
        }
    },

    createRedactor : function(e){
        e.originalEvent.stopPropagation();
        var direction = e.originalEvent.swipe.direction;
        if (direction === "right" && e.originalEvent.swipe.speed > 0) {
            this.publish('navigation.show', {
                content : 'view.redactor',
                container_id : '#screen',
                backstack : true
            });
        }
    },

    changeRedactor : function(e){
        var id = $(e.currentTarget).data('model-id');

        this.publish('navigation.show', {
            content : 'view.redactor',
            container_id : '#screen',
            backstack : true,
            extras : id,
            autocreate : true
        });
    }

}));
