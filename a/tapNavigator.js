(function( $ ) {
    $.fn.tapNavigator = function(options) {

        var defaults = {
                navIconsCount : 5,
                bodyHeight : 0,
                bodyWidth : 0,
                navRadius : 30,
                navDistance : 150
            },
            self = this,
            timer = null,
            pi = Math.PI,
            overlay = $('<div id="tapNavigatorOverlay"></div>'),
            navigator = $('<div id="tapNavigator"></div>'),
            currentPosition = [],
            navIcons = [],
            gridCellWidth = 0;
            gridCellHeight = 0;
            cellAngles = [
                [
                    [pi/2, pi],
                    [pi/2, 1.5*pi],
                    [pi, 1.5*pi]
                ],
                [
                    [0, pi],
                    [0, 2*pi],
                    [pi, 2*pi]
                ],
                [
                    [0, pi/2],
                    [-pi/2, pi/2],
                    [-pi/2, 0]
                ]
            ];
        $.extend(defaults, options);

        defaults.bodyHeight = $('body').height();
        defaults.bodyWidth = $('body').width();

        gridCellWidth = defaults.bodyWidth / 3;
        gridCellHeight = defaults.bodyHeight / 3;

        function _buildHTML (){
            overlay.appendTo('body').css({
                width : '100%',
                height : '100%'
            });


            for (var i = 0; i < defaults.navIconsCount; i++) {
                navIcons[i] = $('<div class="navLink"></div>').css({
                    position: 'absolute',
                    width: 2*defaults.navRadius,
                    height: 2*defaults.navRadius,
                    borderRadius : defaults.navRadius,
                    background : '#ddd'
                }).appendTo(navigator);
            }
            navigator.css({
                position: 'absolute',
                top : 0,
                display : 'none'
            }).appendTo('body');
        }

        function checkTapPosition(){
            var cellX = Math.floor(currentPosition[0] / gridCellWidth);
            var cellY = Math.floor(currentPosition[1] / gridCellHeight);
            showNavLinks(cellX,cellY);
        }

        function showNavLinks(cellX,cellY){

//            var angles = cellAngles[cellX][cellY];
            var angles = checkAngles();
            var offset = (cellX == cellY == 1) ? 0 : 1;
            console.log('ANGLES', angles[0], angles[1]);

            var angleStep = (angles[1] - angles[0]) / (defaults.navIconsCount+offset);
            var angle = angles[0] + angleStep
            for (var i = 0; i < defaults.navIconsCount; i++) {

                var x = currentPosition[0] - defaults.navDistance * Math.cos(angle) - defaults.navRadius;
                var y = currentPosition[1] + defaults.navDistance * Math.sin(angle) - defaults.navRadius;
                setPosition(navIcons[i][0], x, y);
                angle += angleStep;
                console.log('angle', angle);
            }
            navigator.show();
        }

        function setPosition (item, x, y) {
            item.style.position = 'absolute';
            var value = "translate3d(" + x + "px, " + y +  "px, 0)";

            item.style.webkitTransform = value;
            item.style.transform = value;
            item.style.oTransform = value;
            item.style.msTransform = value;
            item.style.mozTransform = value;
        }

        function startTimer () {
            timer = setTimeout(checkTapPosition, 300);
        }

        function stopTimer(){
            clearTimeout(timer);
        }

        function checkAngles(){
//            currentPosition[0] = e.clientX;
//            currentPosition[1] = e.clientY;
            var totalAngle = 2 * pi;
            var radius = defaults.navRadius + defaults.navDistance,
                left = Math.acos(currentPosition[0] / radius),
                right = Math.acos((defaults.bodyWidth - currentPosition[0]) / radius),
                top =  Math.acos(currentPosition[1] / radius),
                bottom = Math.acos((defaults.bodyHeight - currentPosition[1]) / radius);
            var arr = [- top, top, 0.5 * pi - right, 0.5 * pi + right, pi - bottom, pi + bottom, 1.5 * pi - left, 1.5 * pi + left ];
            var arr2 = [];
            for (var i in arr) {
//                if (!isNaN(arr[i])) arr2.push(arr[i] * 180 / 3.14);
                if (!isNaN(arr[i])) arr2.push(arr[i]);
            }

            console.log(top, right, bottom, left);

            var min = Math.min.apply(null, arr2);
            var max = Math.max.apply(null, arr2);

            if (max - min > (2*pi)) {
                max += (max/(2*pi)|0 - min/(2*pi)|0 - 1) * (2*pi);
            }

            return [arr2[arr2.length-1] + pi/2, arr2[0] + 2.5*pi];
        }

        _buildHTML();

        $('body').on('mousedown', function(e){
            currentPosition[0] = e.clientX;
            currentPosition[1] = e.clientY;
            //startTimer();
            //checkAngles();

            checkTapPosition();
        }).on('mouseup', function(e){
            //navigator.hide();
            //stopTimer();
        }).on('mousemove', function(e){
            //navigator.hide();
            //stopTimer();
        });

        $('.navLink').on('mouseenter', function(){
            this.style.background = '#FAC'
        }).on('mouseleave', function(){
            this.style.background = '#DDD'
        }).on('mouseup', function(e){
            console.log('navigate', $(this).index());
        });







    };
})(jQuery);