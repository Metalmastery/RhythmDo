var countdownDate=Date.UTC(2013,7,11,0,0,0);
var fields=[
    {name:"Days",value:0,size:17},
    {name:"Hours",value:0,size:24},
    {name:"Minutes",value:0,size:60},
    {name:"Seconds",value:0,size:60}];
var svg=d3.select("svg").append("svg:g");
var logo=d3.select("#logo");
var arc=d3.svg.arc().innerRadius(70).outerRadius(76).startAngle(2*Math.PI).endAngle(function(d){return((d.size- d.value)/d.size)*2*Math.PI;});
var init=false;
var size={};
var layout="";
runLoop();
setTimeout(function(){
        setInterval(runLoop,1000);}
    ,2000);
function runLoop(){
    size={
        width:window.innerWidth||document.body.clientWidth,
        height:window.innerHeight||document.body.clientHeight};
    console.log(size);
    if(size.width>=900){
        layout="desktop";
        var clock_x=((size.width/2)- 430+ 71);
        var clock_y=((size.height/2)- 80+ 68);
        var logo_x=((size.width/2)- 177- 96);
        var logo_y=((clock_y/2)- 67- 316);
        logo.attr("transform","translate("+ logo_x+","+ logo_y+") scale(0.5)");
        svg.attr("transform","translate("+ clock_x+","+ clock_y+")");}
    else{
        layout="mobile";
        var logo_x=((size.width/2)- 106- 61);
        var logo_y=(50- 193);
        var clock_x=((size.width/2)- 163+ 58);
        var clock_y=200;
        logo.attr("transform","translate("+ logo_x+","+ logo_y+") scale(0.3)");
        svg.attr("transform","translate("+ clock_x+","+ clock_y+") scale(0.8)");}
    if(!init){
        logo
            .transition()
            .duration(2000)
            .style("fill-opacity",1);
        init=true;
    }
    var diff=get_time_difference();
    fields[0].previous=fields[0].value;
    fields[0].value=diff.days;
    fields[1].previous=fields[1].value;
    fields[1].value=diff.hours;
    fields[2].previous=fields[2].value;
    fields[2].value=diff.minutes;
    fields[3].previous=fields[3].value;
    fields[3].value=diff.seconds;
    var path=svg
        .selectAll("path")
        .data(fields,function(d){
            return d.name;
        });
    path.attr("transform",translatePath)
        .transition()
        .ease("bounce")
        .duration(750)
        .attrTween("d",arcTween);
    path.enter().append("svg:path").attr("transform",translatePath).style("fill","#3D9BDA").style("opacity",0).attr("d",function(d){if(d.name==="Seconds"){d.value=d.value- 3;}
        return arc(d);}).transition().duration(3000).style("opacity",1);
    var text=svg.selectAll("text.clocklabel").data(fields,function(d){return d.name;});text.attr("transform",translateText).text(clock_name);text.enter().append("svg:text").attr("class","clocklabel").attr("transform",translateText).text(clock_name).transition().duration(3000).style("opacity",1);var label=svg.selectAll("text.clocktime").data(fields,function(d){return d.name;});label.attr("transform",translateTime).text(countdown_label);label.enter().append("svg:text").attr("class","clocktime").attr("transform",translateTime).text(countdown_label).transition().duration(3000).style("opacity",1);}
function translatePath(d,i){if(layout==="desktop"){return"translate("+((240*i))+",0)";}else{if(i<2){return"translate("+((240*i))+",0)";}else{return"translate("+((240*(i-2)))+",280)";}}}
function translateText(d,i){if(layout==="desktop"){return"translate("+((240*i))+",150)";}else{if(i<2){return"translate("+((240*i))+",130)";}else{return"translate("+((240*(i-2)))+",410)";}}}
function translateTime(d,i){if(layout==="desktop"){return"translate("+((240*i))+",8)";}else{if(i<2){return"translate("+((240*i))+",8)";}else{return"translate("+((240*(i-2)))+",288)";}}}
function arcTween(b){var interpol=d3.interpolate({value:b.previous},b);return function(t){return arc(interpol(t));};}
function get_time_difference()
{var nTotalDiff=countdownDate- new Date().getTime();var oDiff={};oDiff.days=Math.floor(nTotalDiff/1000/60/60/24);nTotalDiff-=oDiff.days*1000*60*60*24;oDiff.hours=Math.floor(nTotalDiff/1000/60/60);nTotalDiff-=oDiff.hours*1000*60*60;oDiff.minutes=Math.floor(nTotalDiff/1000/60);nTotalDiff-=oDiff.minutes*1000*60;oDiff.seconds=Math.floor(nTotalDiff/1000);if(oDiff.seconds<=0&&oDiff.minutes>0){oDiff.seconds=60+ oDiff.seconds;oDiff.minutes--;}
    if(oDiff.minutes===0&&oDiff.hours>0){oDiff.minutes=60+ oDiff.minutes;oDiff.hours--;}
    if(oDiff.hours===0&&oDiff.days>0){oDiff.hours=24+ oDiff.hours;oDiff.days--;}
    if(oDiff.days<=0&&oDiff.hours<=0&&oDiff.minutes<=0&&oDiff.seconds<=0){window.location="http://elementaryos.org";}
    return oDiff;}
function countdown_label(d){if(d.value>9){return d.value;}
else{return"0"+ d.value;}}
function clock_name(d){return d.name;}