/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 3:18 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.task_list", RAD.Blanks.ScrollableView.extend({
    url : 'source/views/tasks/task_list/task_list.html',

//    className: 'positionRelative',

    events: {
        'swipe .task' : 'removeTask',
        'swipe h3' : 'createRedactor',
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
        }

    ],

    onInitialize : function(){
        this.model = RAD.model('task_list');

        this.subscribe('taskListRefresh', this.refreshScroll, this);

        var filtersList = {
            'view.group_today' : function(){
                return true;
            },
            'view.group_brain' : function(item){
                return parseInt(item.attributes.type) === 3;
            },
            'view.group_emo' : function(item){
                return parseInt(item.attributes.type) === 2;
            },
            'view.group_strength' : function(item){
                return parseInt(item.attributes.type) === 1;
            }

        };

        for (var filter in filtersList) {
            if (filtersList.hasOwnProperty(filter)) {
                this.publish(filter, {
                    autocreate : true,
                    extras : {
                        model : this.model,
                        filter : filtersList[filter],
                        groupName : filter
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
        var id = $(e.currentTarget).data('model-id');
        console.log(id);

//        this.publish('view.redactor',{
//            autocreate : true,
//            extras : id
//        });

        this.publish('navigation.show', {
            content : 'view.redactor',
            container_id : '#screen',
            backstack : true,
            extras : id,
            autocreate : true
        });


    }

}));
