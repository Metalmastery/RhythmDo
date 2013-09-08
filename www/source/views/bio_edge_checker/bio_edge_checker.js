RAD.view("view.bio_edge_checker", RAD.Blanks.View.extend({
    url :  'source/views/bio_edge_checker/bio_edge_checker.html',
    events : {
        'tap .bio-icons div' : 'checkBio'
    },
    checkBio : function(e){
        this.$('.pointer')[0].style.left = e.currentTarget.offsetLeft + 'px'
        this.$('.pointer')[0].style.background = 'rgba(' + e.currentTarget.offsetLeft + ',' + e.currentTarget.offsetLeft + ','  + e.currentTarget.offsetLeft + ',0.5)';
    }
}));