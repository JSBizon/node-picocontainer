var pc = require('../picocontainer'),
	ca = require('../componentadapter'),
	should = require('should');


function Apple(){};
var Banana = function(){};

function AppleStore(apple, num){
	this.num = num;
	this._apple = apple;
};
AppleStore.prototype = {
	getApple : function(){
		return this._apple;
	}
};


module.exports = {
	"test addComponent" : function(){

		var container = new pc.PicoContainer();
		container.addComponent('AppleStore',AppleStore,[ca.Instance('Apple'),10]);
		container.addComponent('Apple',Apple);

		var store = container.getComponent('AppleStore');
		
		should.exist(store);
		store.should.be.an.instanceof(AppleStore);
		store.getApple().should.be.an.instanceof(Apple);
		
		store.should.have.property('num', 10);
		should.not.exist(container.getComponent('Banana'));
		
		
	},
	
	"test remove component" : function(){
		var container = new pc.PicoContainer();
		container.addComponent('Apple',Apple);
		
		should.exist(container.getComponent('Apple'));
		
		container.removeComponent('Apple');
		
		should.not.exist(container.getComponent('Apple'));
	},
	
	"test cycling dependencies" : function(){
		var container = new pc.PicoContainer();
		
		container.addComponent('Apple',Apple,[ca.Instance('Banana')]);
		container.addComponent('Banana',Banana,[ca.Instance('Apple')]);
		
		should.throws(function(){
			container.getComponent('Apple');
		});
	},
	
	"test addComponentInstance" : function(){
		var container = new pc.PicoContainer();
		
		var apple = new Apple();
		
		container.addComponentInstance('Apple',apple);
		var componentApple = container.getComponent('Apple');
		
		should.exist(componentApple);
		apple.should.eql(componentApple);
		
		componentApple.should.be.an.instanceof(Apple);
		
		container.addComponent('AppleStore',AppleStore,[ca.Instance('Apple'),20]);
		
		var store = container.getComponent('AppleStore');
		should.exist(store);
		store.getApple().should.be.an.instanceof(Apple);
	},
	
	"test getComponentAdapter" : function(){
		var container = new pc.PicoContainer();
		container.addAdapter(new ca.SetterInjectionAdapter('Apple',Apple));
		
		var adapter = container.getComponentAdapter('Apple');
		should.exist(adapter);
		adapter.should.be.an.instanceof(ca.SetterInjectionAdapter);
	},
	
	"test getComponentFromAdapter" : function(){
		var container = new pc.PicoContainer();
		var adapter = new ca.SetterInjectionAdapter('Apple',Apple);
		//container.addAdapter(adapter);
		
		var apple = container.getComponentFromAdapter(adapter);
		apple.should.be.an.instanceof(Apple);
		
	},
	
	"test getComponentFromAdapter with deps" : function(){
		
	},
	
	"test different dependencies" : function(){
		var container = new pc.PicoContainer();
		container.addComponent('Banana',Banana);
		container.addAdapter(new ca.FieldInjectionAdapter('Apple',Apple,{
																		"banana" : ca.Instance('Banana'),
																		"str" : "some data",
																		"num" : 10,
																		"func" : function(){}
																		}));
		
		var apple = container.getComponent('Apple');
		should.exist(apple);
		apple.should.have.property('str', 'some data');
		apple.should.have.property('num', 10);
		apple.should.have.property('banana').be.an.instanceof(Banana);
		apple.should.have.property('func').be.a('function');
	},
	
	"test initialization via factory function" : function(){
		var container = new pc.PicoContainer();
		
		container.addAdapter(new ca.Caching(new ca.FactoryInjectionAdapter('external-module',function(str){
			var module = require('./external-module');
			module.setStr(str);
			return module;
		},['test'])));
		
		var externalModule = container.getComponent('external-module');
		should.exist(externalModule);
		'test'.should.equal(externalModule.getStr());
	}
};