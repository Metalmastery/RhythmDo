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
        'tap .groupTitle' : 'toggleGroupCustom'
    },

    collapsed : false,

    onInitialize : function(){
        this.model = RAD.model('task_list');
        this.subscribe('current_day_changed', this.currentDayChanged, this);

        var self = this;

        var filterList = {
            'view.group_today' : function(item){
                return ((new Date(item.attributes.date)).getDate() === (new Date(1989, 2, self.currentDay)).getDate() + 1);
            },
            'view.group_tomorrow' : function(item){
                return ((new Date(item.attributes.date)).getDate() === (new Date(1989, 2, self.currentDay)).getDate() + 2);
            },
            'view.group_week' : function(item){
	            var itemDate = new Date(item.attributes.date),
		            currentDay = new Date(1989, 2, self.currentDay),
			        dayOfWeek = currentDay.getDay(),
		            beginWeek = currentDay.getTime() - dayOfWeek * 86400000,
		            endWeek = currentDay.getTime() + (8-dayOfWeek) * 86400000;

                return itemDate.getTime() >= beginWeek && itemDate.getTime() <= endWeek;
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

        this.filter = filterList[this.viewID];
        this.groupName = this.viewID.split('_')[1];
    },

    currentDayChanged : function(c, data){
        this.currentDay = data.currentDay;
	    //console.log(data);
        this.render();
    },

    toggleItemCustom :function(item, state, delay){
        $(item)
            .find('.taskAnimationWrap')
            .toggleClass('task-animate', state)
            .toggleClass('task-animate-long', !state)
            .toggleClass('task-rotate', !state);
            item.style.transitionDelay = state ? (delay+0.2) + 's' : '0';
    },

    toggleGroupCustom : function(){
        console.log('TOGGLE CUSTOM');
        var holder = this.$('.task_list'),
            count = holder.find('.task').length,
            flag = !this.collapsed,
            self = this;
        holder[0].style.height = flag ? 44*count+'px' : 0;
        holder[0].style.transitionDelay = flag ? '0' : '0.5s';
        setTimeout(function(){
            self.publish('taskListRefresh', {});
        }, 1000);
        var items = this.$('.task');

        items.each(function(i){
            self.toggleItemCustom(this, flag, flag ? i*0.1 : (count-i)*0.1);
        });
        this.collapsed=flag;
        //console.log(flag);
    },

    toggleGroup : function(){
        var self = this;

        var tasks = this.$el.find('.task_list .task');
        if (tasks.length) {
            self.collapsed = !self.collapsed;
            var i = 0;

            function callback(){
                i++;
                if (tasks.length === i){
                    self.publish('taskListRefresh', {});
                }
                tasks.eq(i).slideToggle(50, callback);
            }

            tasks.eq(i).slideToggle(50, callback);

//            tasks.each(function(i){
//                var el = $(this);
//
//
////                setTimeout(function(){
////                    el.slideToggle(200, function(){el.find('div').not('.hidden').fadeToggle(200);});
////
////                }, 200*i )
//
//            });
        }



//        this.$el.find('.task_list').slideToggle('fast', function(){
//            self.publish('taskListRefresh', {});
//            self.collapsed = !self.collapsed;
//        }).toggleClass('collapsed', !self.collapsed);

    },

    onStartRender : function(){

    },

    onEndRender : function(){
        this.$el.find('div.task_list')[0].style.height = this.collapsed ? 0 : 'auto';
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
        }
    },

    onReceiveMsg : function(c,d){
        this.onNewExtras(d.extras)
    },

    filter : function(){
        return true;
    }

}));
