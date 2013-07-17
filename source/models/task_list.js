/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 1:51 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.model('task_list', Backbone.Collection.extend({
    model : RAD.models.task,

    dummyFill : function(){
        var date = new Date();
        for (var i = 0; i < 3; i++) {
            this.add({
                type : Math.floor(Math.random() * 3),
                date : date.getDate(),
                time : date.getFullYear(),
                repeat : !Math.floor(Math.random() * 3),
                text : 'ывафвыпфвыап вап вап sd sd s d',
                reminder : !Math.floor(Math.random() * 3),
                id : i
            })
        }
    },

    initialize: function(){
        //this.dummyFill();

    },

    loadData : function(data){
        console.log(data);
    }

}), true);

//    type : 0,
//    text : '',
//    date : '',
//    time : '',
//    repeat : null,
//    reminder : false