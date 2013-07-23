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
        }
    ],

    onInitialize : function(){
        this.model = RAD.model('task_list');

        console.log(RAD.core.getStartedViews());

        var filtersList = {
            'view.group_brain' : function(){
                return true;
            },
            'view.group_emo' : function(){
                return true;
            }
        };

        for (var filter in filtersList) {
            if (filtersList.hasOwnProperty(filter)) {
                this.publish(filter, {
                    autocreate : true,
                    extras : {
                        model : this.model,
                        filter : filtersList[filter]
                    }
                });
            }
        }
    },

    removeTask : function(e){
        //console.log('tap', e);

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
        var id = $(e.target).data('model-id');
        this.publish('navigation.show', {
            content : 'view.redactor',
            container_id : '#screen',
            extras : id,
            backstack : true
        });

    },
    onReceiveMsg : function(c,d){
        console.log(arguments);
    }

}));
