/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/17/13
 * Time: 10:57 AM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.redactor", RAD.Blanks.Popup.extend({
    url : 'source/views/tasks/redactor/redactor.html',

    onInitialize : function(){
        "use strict";

        this.list = RAD.model('task_list');
        this.currentModel = null;
    },

    outSideClose : true,

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

        this.publish('navigation.popup.close', {content: 'view.redactor'});

        this.publish('service.storage.save');
    },

    onStartAttach : function(){
        "use strict";

        this.$el.find('input:text').focus();
    },

    onNewExtras : function(extras){
        "use strict";

        this.currentModel = RAD.model('task_list').get(extras);
        console.log(this.model);
    }

}));
