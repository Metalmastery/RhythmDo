/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/17/13
 * Time: 10:57 AM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.redactor", RAD.Blanks.View.extend({
    url : 'source/views/tasks/redactor/redactor.html',

    onInitialize : function(){
        "use strict";

        this.list = RAD.model('task_list');
        //this.currentModel = null;
    },

    events : {
        'click .save' : 'saveTask'
    },

    saveTask : function(){
        "use strict";


        var task = {};
        this.$el.find('[name]').each(function(index, el){
            task[el.name] = el.value;
            //console.log(el)
        });

        if (this.currentModel) {
            this.currentModel.set(task);
        } else {
            task.id = Math.floor(Math.random() * 300);
            this.list.add(task, {validate: true});
        }

        this.publish('navigation.back', {
            content: 'view.start_page',
            container_id: '#screen'

        });

        this.publish('service.storage.save');
    },

    onStartAttach : function(){
        "use strict";

        var self = this;
        this.$el.find('[name]').each(function(index, el){
            console.log(el.name);
            el.value = self.currentModel.attributes[el.name];
        });
    },

    onNewExtras : function(extras){
        "use strict";

        this.currentModel = RAD.model('task_list').get(extras);
    },
    onReceiveMsg : function(c, data){
        console.log('received', data);
    }

}));
