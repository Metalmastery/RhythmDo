/**
 * Created with JetBrains WebStorm.
 * User: ihor
 * Date: 7/31/13
 * Time: 12:05 PM
 * To change this template use File | Settings | File Templates.
 */
RAD.view("view.monitor", RAD.Blanks.View.extend({
    url : 'source/views/monitor/monitor.html',

    currentDay : null,

    currentDayBio : null,

    drawBio : function(){
        //TODO draw current biorhytms with arcs
    },

    startAnimation : function(){
        //TODO animate arcs between biorhytm values && fast-increment digits
    },

    stopAnimation : function(){

    }

}));