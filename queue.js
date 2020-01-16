
module.exports = Queue

function Queue()
{
  this.stac=new Array();

  this.pop=function(){
    return this.stac.pop();
  }
  this.push=function(item){
    this.stac.unshift(item);
  }
  this.length = function(){
    return this.stac.length;
  }
}
