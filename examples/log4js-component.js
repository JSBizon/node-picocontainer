var pc = require('../picocontainer');

var container = new pc.PicoContainer();

container.addAdapter(new pc.Caching(new pc.FactoryInjectionAdapter('logger',function(fileName,logLevel){
	var log4js = require('log4js')();
	
	log4js.clearAppenders();
	log4js.addAppender(log4js.fileAppender(fileName), 'mylogger');

	var logger = log4js.getLogger('mylogger');
	logger.setLevel(logLevel);

	return logger;
},['./mylog.log','ERROR'])));

var logger = container.getComponent('logger');
logger.error('Logger works!!!');
logger.warn('Nor show warn!!!');