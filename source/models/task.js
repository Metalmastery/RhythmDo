/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/16/13
 * Time: 1:18 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.model('task', Backbone.Model.extend({
    defaults: {
        type : 0,
        text : '',
        date : '',
        time : '',
        repeat : null,
        reminder : false
    },

    initialize : function(){
        //this.validate(this.attributes);
    },

    validate : function(attr, options){
        console.log(attr);
        if (attr.text.length === 0) {
            return 'empty text';
        }
    }

}), false);