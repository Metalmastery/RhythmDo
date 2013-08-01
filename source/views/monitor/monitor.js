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

	drawing : {
		canvasArray : [],
		contextArray : [],
		cycleDayArray : [],
		cycleTrendArray : [],
		negativeArray : [],
		colors : ['#40b2e4', '#f75d55', '#01d5be'],
		canvasWidth : 170,
		canvasHeight : 170
	},

	currentBio : [0,0,0],

	animation : {
		now : null,
		lasTime : null,
		animID : null,
		destinationBio : [0,0,0],
		displayedBio : [0,0,0],
		circleDelta : 0.1,
		circleStep : 0.05
	},

	onInitialize : function(){
		var self = this;
//		this.subscribe('monitor.ready', this.test, this);
		window.setInterval(function(){
			self.test();
		}, 2000);
	},

	test : function(){
		var testBio = [];
		for (var i = 0; i < 3; i++) {
			testBio[i] = Math.random() * 2 - 1;
		}

		this.startAnimation(testBio);
	},

	stepAnimation : function(){

	    var self = this,
		    diff,
		    diffSign,
		    valChanged = false,
		    now = new Date().getTime(),
		    time =  (now - self.animation.lasTime) / 300,
		    destination = self.animation.destinationBio,
		    current = self.currentBio;

		self.animation.lasTime = now;

		for (var i = 0; i < destination.length; i++){
			diff = current[i] - destination[i];
			diffSign = diff > 0 ? 1 : -1;
			if (current[i] !== destination[i]) {
				valChanged = true;
			}
			if (Math.abs(diff) > self.animation.circleDelta) {
				current[i] -= (time < 1 ? time : self.animation.circleStep) * diffSign;
				//self.animation.animID = window.requestAnimationFrame(self.stepAnimation);
			} else {
				current[i] = destination[i];
			}
		}
		if (!valChanged){
			self.currentBio = current;
			self.animation.lasTime = null;
		}

		self.drawBio(current);

		return valChanged;
	},

	startAnimation : function(destination){
		var self = this;
		self.animation.destinationBio = destination;

		function callback(){
			var res = self.stepAnimation();
			if (res) {
				self.animation.animID = window.requestAnimationFrame(callback);
			} else {
				self.stopAnimation();
			}
		}
		self.animation.animID = window.requestAnimationFrame(callback);
	},

	stopAnimation : function(){
		var self = this;
		if (this.animation.animID) {
			window.cancelAnimationFrame(self.animation.animID)
		}
		self.publish('monitor.ready', {});
	},

	onEndRender : function(){
	    this.initMonitor();
	},

	initMonitor : function(){
		var self = this;
		var blocks = ['strength', 'emo', 'brain'];
		for (var i = 0; i<blocks.length; i++) {
			var block = self.$('.' + blocks[i]);
			var canvas = block.find('canvas').attr({
				height : self.drawing.canvasHeight,
				width : self.drawing.canvasWidth
			})[0];
			self.drawing.canvasArray.push(canvas);
			self.drawing.contextArray.push(canvas.getContext('2d'));
			self.drawing.cycleDayArray.push(block.find('.cycle_day')[0]);
			self.drawing.cycleTrendArray.push(block.find('.cycle_trend')[0]);
			self.drawing.negativeArray.push(block.find('.negative')[0]);
		}
		self.test();
	},

    drawBio : function(arrayBio){
	    var value,
		    sign,
		    context,
		    color,
		    self = this,
		    offset = - Math.PI / 2;
		    max = arrayBio.indexOf(Math.max.apply( Math, arrayBio )),
		    size = self.drawing.canvasArray[0].height;

	    for (var i = 0; i<arrayBio.length; i++) {
		    sign = arrayBio[i] > 0 ? 1 : -1;
//		    value = arrayBio[i] * 2 * Math.PI;
		    value = Math.abs(arrayBio[i]) * 2 * Math.PI;

		    context = self.drawing.contextArray[i];
		    color = self.drawing.colors[i];

		    self.drawing.negativeArray[i].style.display = sign > 0 ? 'none' : 'block';

		    context.clearRect(0,0,200,200);

		    window.context = context;

		    context.lineWidth = 12;
		    context.strokeStyle = color;
		    context.beginPath();
		    if (i === max) {
			    context.setLineDash([2,3]);
		    } else {
			    context.setLineDash([]);
		    }
		    context.arc(size/2, size/2, size/2 - 13, offset, offset + value * sign, sign < 0);
		    context.stroke();
	    }
    }
}));