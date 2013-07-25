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

    className : 'positionRelative',

    events: {
        'tap .groupTitle' : 'toggleGroup'
    },

    collapsed : false,

    toggleGroup : function(){
        var self = this;

        this.$el.find('.task_list').slideToggle('fast', function(){
            self.publish('taskListRefresh', {});
            self.collapsed = !self.collapsed;
        }).toggleClass('collapsed', !self.collapsed);

    },

    onStartRender : function(){
        console.log('render started');

    },

    onEndRender : function(){
        this.$el.find('.task_list').toggleClass('collapsed', this.collapsed);
    },

    onNewExtras : function(data){
        if (!data){
            return false;
        }
        if (data.groupName && data.groupName.length){
            this.groupName = data.groupName;
        }
        if (data.model) {
            this.model = data.model;
        }
        if (typeof data.filter === 'function'){
            this.filter = data.filter;
            if (!data.model) {
                this.render();
            }

        }
    },

    onReceiveMsg : function(c,d){
        this.onNewExtras(d.extras)
    },

    filter : function(){
        return true;
    }

}));
