/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/17/13
 * Time: 2:12 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.service('service.storage', RAD.Blanks.Service.extend({
    onReceiveMsg : function (channel, data) {
        "use strict";
        var action = channel.split('.');
        action = action[action.length-1] + 'Data';
        if (typeof this[action] === 'function'){
            this[action].apply(this, data);
        }
    },

    onInitialize : function(){
        this.model = RAD.models.task_list;
    },

    restoreData : function(){
        "use strict";

        var data = localStorage.getItem('test');
        if (data) {
            //this.publish('storage.dataRestored', JSON.parse(data));
            this.model.set(JSON.parse(data));
        }
    },

    saveData : function(data){
        "use strict";
        localStorage.setItem('test', JSON.stringify(this.model.toJSON()));
    }

}));