/**
 * 1 что такое адапптеры
 * фабрики объектов - с помоцью которых объекты и создаются
 * могут объединяться в цепочки
 * Caching -> Constructor Injection
 * 2 Как работает constructor DI в PHP 
 * создаётся объект через ComponentAdapter, 
 * также вычисляются типы зависимостей в конструкторе компонента
 * в JS такое не пройдёт так как нет типов параметров
 * 
 * 3 Как работает ComponentAdapter в PHP
 * 
 * 4 Список ComponentAdapter
 * 
 */

/*
PicoContainer

ComponentAdapter

function Apple(){}
function Banana(){}

function Store(apple,banana){
	this._apple = apple;
	this._banana = banana;
}

pico = new PicoContainer();
pico.addComponent('Apple');
pico.addComponent('Banana');
pico.addComponent('Store',Store,[Apple,Banana]);

pico.addComponent(Store,[Instance(Apple),Instance("Banana"), "some data", 10, function(){}]);


pico.addComponent(Caching(ConstructorInjection('logger',function(fileName,logLevel){
	var log4js = require('log4js')();
	log4js.addAppender(log4js.fileAppender(fileName), 'mylogger');
	
	var logger = log4js.getLogger('mylogger');
	logger.setLevel(logLevel);
	
	return logger;
},['./mylog.log','ERROR']));

pico.getComponent(Store);


addComponentImpl(key, class, dependencies)

getComponent(Foo);




Foo.setName = function(){};

pico.addComponentImpl('Name',Name);
pico.addComponent(new SetterInjection('Foo',Foo,[Name]));

*/

var ca = require('./componentadapter'),
	Interface = require('./interface');

function PicoContainer(componentAdapterFactory){
	this._componentAdapters = {};
	this._componentAdapterFactory = componentAdapterFactory;
	if(! this._componentAdapterFactory){
		this._componentAdapterFactory = new ca.ConstructorInjectionFactory();
	}
};

module.exports.PicoContainer = PicoContainer;


PicoContainer.prototype.addAdapter = function(componentAdapter){
	if(! componentAdapter){
		throw Error("Required parameter component adapter.");
	}
	
	var componentKey = componentAdapter.getComponentKey();
	if(this._componentAdapters[componentKey]){
		throw Error("Component key '" + componentKey + "' already registered.");
	}
	this._componentAdapters[componentKey] = componentAdapter;
};


PicoContainer.prototype.addComponent = function(componentKey, componentImpl, dependencies){
	this.addAdapter(this._componentAdapterFactory.createComponentAdapter(componentKey, componentImpl, dependencies));
};


PicoContainer.prototype.addComponentInstance = function(componentKey, componentInstance){
	this.addAdapter(new ca.InstanceAdapter(componentKey, componentInstance));
};


PicoContainer.prototype.removeComponent = function(componentKey){
	delete this._componentAdapters[componentKey];
};


PicoContainer.prototype.getComponent = function(componentKey){
	var componentAdapter = this.getComponentAdapter(componentKey);
	return componentAdapter ? this.getComponentFromAdapter(componentAdapter) : null;
};


PicoContainer.prototype.getComponentAdapter = function(componentKey){
	if(componentKey && this._componentAdapters[componentKey]){
		return this._componentAdapters[componentKey];
	}
};


PicoContainer.prototype.getComponentFromAdapter = function(componentAdapter){
	if(componentAdapter){
		return componentAdapter.getComponentInstance(this);
	}
};

