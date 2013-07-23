/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/23/13
 * Time: 12:11 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view(["view.group_brain", "view.group_emo", "view.group_strength", "view.group_today", "view.group_tomorrow", "view.group_week"], RAD.Blanks.View.extend({
    url : 'source/views/tasks/groups/group.html',

    groupName : 'group',

    onNewExtras : function(data){
        console.log(data);
        if (!data){
            return false;
        }
        if (typeof data.filter === 'function'){
            this.filter = data.filter;
        }
        this.model = data.model;
    },

    onReceiveMsg : function(c,d){
        console.log(arguments);
    },

    filter : function(){
        return true;
    }

}));
