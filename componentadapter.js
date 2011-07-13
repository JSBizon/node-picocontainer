var util = require('util'),
	Interface = require('./interface');

/**
 * Class for wrap instance.
 * @constructor
 * @param {String} componentKey The component  
 */
function Instance(componentKey){
	if(this instanceof Instance){
		this._componentKey = componentKey;
		return this;
	}
	return new Instance(componentKey);
}
exports.Instance = Instance;

/** @lends Instance */
/** @public */
Instance.prototype.create = function(container){
	var instance = container.getComponent(this._componentKey);
	if(instance === null)
		throw Error("Unsatisfiable dependencies " + this._componentKey);
	return instance;
};

Instance.prototype.getComponentKey = function(){
	return this._componentKey;
};

/*
 * Component adapter factories
 */

function ConstructorInjectionFactory(){}

ConstructorInjectionFactory.prototype.createComponentAdapter = function(componentKey, componentImpl, dependencies){
	return new ConstructorInjectionAdapter(componentKey, componentImpl, dependencies);
};

exports.ConstructorInjectionFactory = ConstructorInjectionFactory;


function SetterInjectionFactory(setterPrefix){
	this._setterPrefix = setterPrefix;
}

SetterInjectionFactory.prototype.createComponentAdapter = function(componentKey, componentImpl, dependencies){
	var adapter = new SetterInjectionAdapter(componentKey, componentImpl, dependencies);
	if(this._setterPrefix !== null && this._setterPrefix !== undefined){
		adapter.setterPrefix = _setterPrefix;
	}
	
	return adapter;
};

exports.SetterInjectionFactory = SetterInjectionFactory;


function FieldInjectionFactory(){}

FieldInjectionFactory.prototype.createComponentAdapter = function(componentKey, componentImpl, dependencies){
	return new FieldInjectionAdapter(componentKey, componentImpl, dependencies);
};

exports.FieldInjectionFactory = FieldInjectionFactory;


function DecoratingFactory(delegate){
	this._delegate = delegate;
}

DecoratingFactory.prototype.createComponentAdapter = function(componentKey, componentImpl, dependencies){
	return new Decorating(this._delegate.createComponentAdapter(componentKey, componentImpl, dependencies));
};

exports.DecoratingFactory = DecoratingFactory;


function CachingFactory(delegate){
	this._delegate = delegate;
}

DecoratingFactory.prototype.createComponentAdapter = function(componentKey, componentImpl, dependencies){
	return new Caching(this._delegate.createComponentAdapter(componentKey, componentImpl, dependencies));
};

exports.CachingFactory = CachingFactory;

function FactoryInjectionFactory(){}

FactoryInjectionFactory.prototype.createComponentAdapter = function(componentKey, componentFactory, dependencies){
	return new FactoryInjectionAdapter(componentKey, componentFactory, dependencies);
};

exports.FactoryInjectionFactory = FactoryInjectionFactory;

/*
 * Component adapters
 */

function ComponentAdapter(componentKey, componentImpl, dependencies){
	this._componentKey = componentKey;
	this._componentImpl = componentImpl;
	
	if( ! this._componentImpl){
		throw Error("Component implementation required");
	}
	
	if( ! dependencies){
		this._dependencies = [];
	}else{
		if(typeof(dependencies) !== 'object'){
			this._dependencies = [dependencies];
		}else{
			this._dependencies = dependencies;
		}
	}
}

exports.ComponentAdapter = ComponentAdapter;

ComponentAdapter.prototype.getComponentKey = function(){
	return this._componentKey;
};

ComponentAdapter.prototype.checkComponentInterface = function(componentInst){
	if(! componentInst)
		return;
	var componentKey = this.getComponentKey();
	if(componentKey instanceof Interface){
		Interface.ensureImplements(componentInst,componentKey);
	}
};

ComponentAdapter.prototype._resolveObject = function(obj,container){
	if(obj instanceof Instance){
		return obj.create(container);
	}else if(obj instanceof Interface){
		return container.getComponent(obj);
	}else{
		return obj;
	}
};

ComponentAdapter.prototype.getComponentDependencies = function(){
	return this._dependencies;
};

ComponentAdapter.prototype.getComponentImplementation = function(){
	return this._componentImpl;
};

ComponentAdapter.prototype.getComponentInstance = function(container){
	throw Error("Method getComponentInstance not implemented");
};


function ConstructorInjectionAdapter(componentKey, componentImpl, dependencies){
	ComponentAdapter.call(this, componentKey, componentImpl, dependencies);
	this.instantiationGuard = false;
}
util.inherits(ConstructorInjectionAdapter, ComponentAdapter);
exports.ConstructorInjectionAdapter = ConstructorInjectionAdapter;

ConstructorInjectionAdapter.prototype.getComponentInstance = function(container){
	var componentInst;
	if (this.instantiationGuard) {
		throw Error("Cyclic depencies detected");
	}
	
	this.instantiationGuard = true;
	try{
		var componentImpl = this.getComponentImplementation();
		if(typeof(componentImpl) !== 'function'){
			componentInst = componentImpl;
		}else{
			var dependencies = this.getComponentDependencies();
			var resolved = Array.isArray(dependencies) ? [] : {};
			for(var key in dependencies){
				var obj = dependencies[key];
				resolved[key] = this._resolveObject(obj,container);
			}
	
			if(Array.isArray(resolved)){
				componentInst = construct(componentImpl,resolved);
			}else{
				componentInst = new componentImpl(resolved);
			}
		}
		
	}
	catch(error){
		this.instantiationGuard = false;
		throw error;
	}
	this.instantiationGuard = false;
	
	this.checkComponentInterface(componentInst);
	
	return componentInst;
};


function InstanceAdapter(componentKey, componentInst){
	this._componentInst = componentInst;
	
	var componentImpl = componentInst.constructor;
	
	if( ! componentKey){
		componentKey = componentImpl;
	}
	
	ComponentAdapter.call(this, componentKey, componentImpl);
}
util.inherits(InstanceAdapter, ComponentAdapter);
exports.InstanceAdapter = InstanceAdapter;

InstanceAdapter.prototype.getComponentInstance = function(container){
	return this._componentInst;
};


function SetterInjectionAdapter(componentKey, componentImpl, dependencies){
	ComponentAdapter.call(this, componentKey, componentImpl, dependencies);
	this.instantiationGuard = false;
	this.setterPrefix = "set";
}
util.inherits(SetterInjectionAdapter, ComponentAdapter);
exports.SetterInjectionAdapter = SetterInjectionAdapter;

SetterInjectionAdapter.prototype.getComponentInstance = function(container){
	
	if (this.instantiationGuard) {
		throw Error("Cyclic depencies detected");
	}
	this.instantiationGuard = true;
	try{
		var componentImpl = this.getComponentImplementation();
	
		var componentInst;
	
		if(typeof(componentImpl) !== 'function'){
			componentInst = componentImpl;
		}else{
			componentInst = new componentImpl();
			var dependencies = this.getComponentDependencies();
			
			for(var key in dependencies){
				var obj = dependencies[key];
				var setterName = this.setterPrefix;
				
				
				if(Array.isArray(dependencies)){
					var keyPart = "";
			
					if(obj instanceof Instance){
						keyPart = obj.getComponentKey();
					}else if(obj instanceof Interface){
						keyPart = obj.toString();
					}

					if( ! keyPart){
						//throw Error("Can't resolve dependencies key " + obj);
						continue;
					}
					setterName += keyPart;
				}else{
					setterName += key;
				}
				
				if(componentInst[setterName] && typeof(componentInst[setterName]) == 'function'){
					var depsInst = this._resolveObject(obj,container);
					componentInst[setterName](depsInst);
				}
			}
		}
		
	}
	catch(error){
		this.instantiationGuard = false;
		throw error;
	}
	this.instantiationGuard = false;
	
	this.checkComponentInterface(componentInst);
	
	return componentInst;
};


function FieldInjectionAdapter(componentKey, componentImpl, dependencies){
	ComponentAdapter.call(this, componentKey, componentImpl, dependencies);
	this.instantiationGuard = false;
}
util.inherits(FieldInjectionAdapter, ComponentAdapter);
exports.FieldInjectionAdapter = FieldInjectionAdapter;

FieldInjectionAdapter.prototype.getComponentInstance = function(container){
	if (this.instantiationGuard) {
		throw Error("Cyclic depencies detected");
	}
	this.instantiationGuard = true;
	try{
		var componentImpl = this.getComponentImplementation();
	
		var componentInst;
	
		if(typeof(componentImpl) !== 'function'){
			componentInst = componentImpl;
		}else{
			componentInst = new componentImpl();
			var dependencies = this.getComponentDependencies();

			for(var key in dependencies){
				var obj = dependencies[key],
					fieldName = "";
			
				var resolvedDep = this._resolveObject(obj,container);
			
				if(Array.isArray(dependencies)){
					var keyPart = "";
				
					if(obj instanceof Instance){
						keyPart = obj.getComponentKey();
					}else if(obj instanceof Interface){
						keyPart = obj.toString();
					}
				
					if( ! keyPart){
						//throw Error("Can't resolve dependencies key " + obj);
						continue;
					}

					fieldName += keyPart;
				}else{
					fieldName += key;
				}
				componentInst[fieldName] = resolvedDep;
			}
		}
	}
	catch(error){
		this.instantiationGuard = false;
		throw error;
	}
	this.instantiationGuard = false;
	
	this.checkComponentInterface(componentInst);
	
	return componentInst;
};


function FactoryInjectionAdapter(componentKey, componentImpl, dependencies){
	ComponentAdapter.call(this, componentKey, componentImpl, dependencies);
	this.instantiationGuard = false;
}
util.inherits(FactoryInjectionAdapter, ComponentAdapter);
exports.FactoryInjectionAdapter = FactoryInjectionAdapter;

FactoryInjectionAdapter.prototype.getComponentInstance = function(container){
	if (this.instantiationGuard) {
		throw Error("Cyclic depencies detected");
	}
	this.instantiationGuard = true;
	try{
		var componentFactory = this.getComponentImplementation();
	
		var componentInst;
	
		if(typeof(componentFactory) !== 'function'){
			componentInst = componentFactory;
		}else{
			var dependencies = this.getComponentDependencies();

			var resolved = Array.isArray(dependencies) ? [] : {};
			for(var key in dependencies){
				var obj = dependencies[key];
				resolved[key] = this._resolveObject(obj,container);
			}
			
			if(Array.isArray(resolved)){
				componentInst = componentFactory.apply(null,resolved);
			}else{
				componentInst = componentFactory.call(null,resolved);
			}
		}
	}
	catch(error){
		this.instantiationGuard = false;
		throw error;
	}
	this.instantiationGuard = false;
	
	this.checkComponentInterface(componentInst);
	
	return componentInst;
};


function Decorating(delegate){
	this._delegate = delegate;
}
exports.Decorating = Decorating;

Decorating.prototype.getComponentKey = function(){
	return this._delegate.getComponentKey();
};

Decorating.prototype.getComponentDependencies = function(){
	return this._delegate.getComponentDependencies();
};

Decorating.prototype.getComponentImplementation = function(){
	return this._delegate.getComponentImplementation();
};

Decorating.prototype.getComponentInstance = function(container){
	return this._delegate.getComponentInstance(container);
};

Decorating.prototype.getDelegate = function(){
	return this._delegate;
};


function Caching(delegate){
	Decorating.call(this, delegate);
	this._instance = null;
}
util.inherits(Caching, Decorating);
exports.Caching = Caching;

Caching.prototype.getComponentInstance = function(container){
	if( ! this._instance ){
		this._instance = this._delegate.getComponentInstance(container);
	}
	return this._instance;
};


function construct(constructor, args) {
	function F() {
		return constructor.apply(this, args);
	}
	F.prototype = constructor.prototype;
	return new F();
}

