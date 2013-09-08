RAD.view("view.profile_main", RAD.Blanks.View.extend({
    url :  'source/views/profile/profile.html',
    events : {
        'tap .item-wrapper' : 'changePage'
    },
//    children : [
//        {
//            container_id : '#profile_page',
//            content : 'view.profile_view'
//        }
//    ],

    profiler : {
        pointer : null,
        profilePages : [
            'view.profile_settings',
            'view.profile_view',
            'view.profile_edit'
        ],
        currentPage : 1
    },

    changePage : function (e){
        var self = this,
            targetPage = +e.currentTarget.getAttribute('data-page');
        //console.log('CHANGE', e.currentTarget.offsetLeft);
        this.profiler.pointer.style.left = e.currentTarget.offsetLeft + 'px';
        this.publish('navigation.show', {
            content : self.profiler.profilePages[targetPage],
            container_id: '#profile_page',
            animation : targetPage < self.profiler.currentPage ? 'slide-out' : 'slide-in'
        });
        this.profiler.currentPage = targetPage;
    },

    initProfiler : function(){
        this.profiler.pointer = this.$('.pointer')[0];
        this.profiler.currentPage = 1;
        this.profiler.pointer.style.left = this.$('.item-wrapper')[this.profiler.currentPage].offsetLeft + 'px';
        this.publish('navigation.show', {
            content : this.profiler.profilePages[this.profiler.currentPage],
            container_id: '#profile_page',
            animation : 'none'
        });
    },

    onEndRender : function(){
        this.initProfiler();
    },

    onEndAttach : function(){

    }
}));