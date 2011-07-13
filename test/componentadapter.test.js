var pc = require('../picocontainer'),
	ca = require('../componentadapter');
	
var should = require('should');



var Apple = function(){
	this.setBanana = function(){
	}
};

var Banana = function(){
	this.setApple = function(){
	}
};

var AppleStore = function(apple){
	this._apple = apple;
};

function AppleStore2(){
	this.setApple = function(apple){
		this._apple = apple;
	};
	
	this.setNum = function(num){
		this._num = num;
	};
	
	this.getApple = function(){
		return this._apple;
	};
	
	this.getNum = function(){
		return this._num; 
	};
}


function BananaStore(config){
	this.config = config; 
}

module.exports = {
	"test ConstructorInjectionAdapter" : function(){
		var container = new pc.PicoContainer();
		container.addComponent('Apple',Apple);
		
		var storeAdapter = new ca.ConstructorInjectionAdapter('AppleStore',AppleStore,[ca.Instance('Apple'),10]);
		should.exist(storeAdapter);
		storeAdapter.getComponentKey().should.eql('AppleStore');
		storeAdapter.getComponentImplementation().should.eql(AppleStore);
		var deps = storeAdapter.getComponentDependencies();
		deps.should.be.an.instanceof(Array);
		deps.should.have.lengthOf(2);
		deps[0].should.be.an.instanceof(ca.Instance);
		
		var instance = storeAdapter.getComponentInstance(container);
		instance.should.be.an.instanceof(AppleStore);
		
		container.removeComponent('Apple');
		
		container.addComponent('Apple',Apple,[ca.Instance('Banana')]);
		container.addComponent('Banana',Banana,[ca.Instance('Apple')]);
		
		should.throws(function(){
			var apple = container.getComponent('Apple');
		});
		
		should.throws(function(){
			container.getComponent('Banana');
		});
	},
	
	"test ConstructorInjectionAdapter object parameter" : function(){
		
		var storeAdapter = new ca.ConstructorInjectionAdapter('BananaStore',BananaStore,{ 
															num : 10,
															name : "UncleTom"});
		storeAdapter.getComponentImplementation().should.eql(BananaStore);
		var deps = storeAdapter.getComponentDependencies();
		deps.should.be.an.instanceof(Object);
		
		var container = new pc.PicoContainer();
		var instance = storeAdapter.getComponentInstance(container);
		instance.should.be.an.instanceof(BananaStore);
		instance.config.should.have.property('num', 10);
		instance.config.should.have.property('name', 'UncleTom');
	},
	
	"test  ConstructorInjectionAdapter Factory" : function(){
		var componentFactory = new ca.ConstructorInjectionFactory();
		
		var container = new pc.PicoContainer(new ca.ConstructorInjectionFactory());
		container.addComponent('AppleStore',AppleStore,[10]);
		container.getComponent('AppleStore').should.be.an.instanceof(AppleStore);
		container.getComponent('AppleStore')._apple.should.be.eql(10);
	},
	
	"test SetterInjectionAdapter" : function(){
		var container = new pc.PicoContainer(new ca.SetterInjectionFactory());
		container.addComponent('AppleStore',AppleStore2,[ca.Instance('Apple'),10]);
		
		should.throws(function(){
			container.getComponent('AppleStore');
		});
		
		container.addComponent('Apple',Apple);
		
		var appleStore = container.getComponent('AppleStore');
		appleStore.getApple().should.be.an.instanceof(Apple);
		should.not.exist(appleStore.getNum());
		
		container.removeComponent('Apple');
		
		container.addComponent('Apple',Apple,[ca.Instance('Banana')]);
		container.addComponent('Banana',Banana,[ca.Instance('Apple')]);
		
		should.throws(function(){
			container.getComponent('Apple');
		});
		
		should.throws(function(){
			container.getComponent('Banana');
		});
	},
	
	"test SetterInjectionAdapter object parameter" : function(){
		var container = new pc.PicoContainer(new ca.SetterInjectionFactory());
		
		container.addComponent('AppleStore',AppleStore2,{'Apple' : ca.Instance('Apple'), 'Num' : 10});
		should.throws(function(){
			container.getComponent('AppleStore');
		});
		
		container.addComponent('Apple',Apple);
		
		var appleStore = container.getComponent('AppleStore');
		
		appleStore.getApple().should.be.an.instanceof(Apple);
		appleStore.getNum().should.be.eql(10);
	},
	
	"test FieldInjectionAdapter" : function(){
		var container = new pc.PicoContainer(new ca.FieldInjectionFactory());
		container.addComponent('AppleStore',AppleStore,[ca.Instance('Apple'),10,"str parameter"]);
		should.throws(function(){
			container.getComponent('AppleStore');
		});
		container.addComponent('Apple',Apple);
		var appleStore = container.getComponent('AppleStore');
		appleStore.Apple.should.be.an.instanceof(Apple);
		
		container.removeComponent('Apple');
		
		container.addComponent('Apple',Apple,[ca.Instance('Banana')]);
		container.addComponent('Banana',Banana,[ca.Instance('Apple')]);
		
		should.throws(function(){
			container.getComponent('Apple');
		});
		
		should.throws(function(){
			container.getComponent('Banana');
		});
	},
	
	"test FieldInjectionAdapter object parameter" : function(){
		var container = new pc.PicoContainer(new ca.FieldInjectionFactory());
		container.addComponent('AppleStore',AppleStore,{'apple' : ca.Instance('Apple'), 'num' : 10, 'str' :"str parameter"});
		container.addComponent('Apple',Apple);
		var appleStore = container.getComponent('AppleStore');
		appleStore.apple.should.be.an.instanceof(Apple);
		appleStore.num.should.be.eql(10);
		appleStore.str.should.be.eql("str parameter");
	},
	
	"test FactoryInjectionAdapter" : function(){
		var container = new pc.PicoContainer(new ca.FactoryInjectionFactory());
		container.addComponent('Unknown',function(apple){
			return new AppleStore(apple);
		},[ca.Instance('Apple')]);
		
		should.throws(function(){
			container.getComponent('Unknown');
		});
		
		container.addComponent('Apple',function(){ return new Apple() });
		var appleStore = container.getComponent('Unknown');
		appleStore.should.be.an.instanceof(AppleStore);
		appleStore._apple.should.be.an.instanceof(Apple);
		
		container.removeComponent('Apple');
		
		container.addComponent('Apple',function(){ return new Apple()},[ca.Instance('Banana')]);
		container.addComponent('Banana',function(){ return new Banana()},[ca.Instance('Apple')]);
		
		should.throws(function(){
			container.getComponent('Apple');
		});
		
		should.throws(function(){
			container.getComponent('Banana');
		});
	},
	
	"test Caching behaviour" : function(){
		var container = new pc.PicoContainer();
		
		container.addComponent('Banana',Banana);
		var banana1 = container.getComponent('Banana');
		var banana2 = container.getComponent('Banana');
		banana1.should.be.not.eql(banana2);
		
		container.addAdapter(new ca.Caching(new ca.ConstructorInjectionAdapter('AppleStore',AppleStore,[ca.Instance('Apple')])));
		container.addAdapter(new ca.Caching(new ca.FieldInjectionAdapter('Apple',Apple,[10])));
		
		var appleStore1 = container.getComponent('AppleStore');
		var appleStore2 = container.getComponent('AppleStore');
		appleStore1.should.be.eql(appleStore2);
	}
};