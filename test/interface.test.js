var pc = require('../picocontainer'),
	ca = require('../componentadapter'),
	Interface = require('../interface'),
	should = require('should');

var IStore = new Interface('Store',['add','remove']);
var IApple = new Interface('Apple', ['getColor', 'getSize']);
var IBanana = new Interface('Banana', ['getColor', 'getSize']);


function Store1(apple){
	
	this._apple = apple;
	
	this.getApple = function(){
		return this._apple;
	};
	this.add = function(){};
	this.remove = function(){};
}

function Apple(color,size){
	this._color = color;
	this._size = size;
	
	this.getColor = function(){
		return this._color;
	};
	this.getSize = function(){
		return this._size;
	};
}

module.exports = {
	"test Interface check" : function(){
		var store = new Store1();
		
		Interface.ensureImplements(new Store1(),IStore);
		should.throws(function(){
			Interface.ensureImplements(new Apple(),IStore);
		});
	},
	
	"test addComponent" : function(){
		var container = new pc.PicoContainer();
		container.addComponent(IStore,Store1,[10]);
		should.throws(function(){
			container.addComponent(IStore,Apple);
		});
		var store = container.getComponent(IStore);
		
		should.exist(store);
		
		should.doesNotThrow(function(){
			Interface.ensureImplements(store,IStore);
		});
		
		store.should.be.instanceof(Store1);
		
		container.removeComponent(IStore);
		container.addComponent(IStore,Apple);
		
		should.throws(function(){
			container.getComponent(IStore);
		});
	},
	
	"test Interface parameter" : function(){
		var container = new pc.PicoContainer();
		container.addComponent(IStore,Store1,[IApple]);
		container.addComponent(IApple,Apple,['white',10]);
		
		var store = container.getComponent(IStore);
		should.exist(store);
		
		should.doesNotThrow(function(){
			Interface.ensureImplements(store,IStore);
		});
		var apple = store.getApple();
		should.exist(apple);
		
		apple.should.be.instanceof(Apple);
		apple.getColor().should.eql('white');
		apple.getSize().should.eql(10);
	}
};