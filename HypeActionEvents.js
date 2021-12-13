/*!
Hype Action Events 1.0.0
copyright (c) 2021 Max Ziebell, (https://maxziebell.de). MIT-license
*/

/*
* Version-History
* 1.0.0	Initial release under MIT-license
*/
if("HypeActionEvents" in window === false) window['HypeActionEvents'] = (function () {

	var _extensionName = 'Hype Action Events';

	/**
	 * This function is determins if we in a Hype Preview. 
	 *
	 * @return {Bolean} Return true if not on device
	 */
	function isHypePreview(){
		return window.location.href.indexOf("127.0.0.1:") != -1 &&
			window.location.href.indexOf("/preview/") != -1;
	}
	
	// defaults
	var _default = {

		debug: false,

		// strict expressions (prevent any context)
		StrictMode: false,

		// flags for code context
		ContextCustomData: true,
		ContextHypeFunctions: true,
		ContextHypeDocument: true,
		ContextSymbolInstance: true,
		ContextBindHypeFunctions: true,

		// matter events
		MatterEvents: ['collisionStart', 'collisionEnd', 'collisionActive'],

		// mouse events ( MouseEvent ):
		MouseEvents: ['mousedown', 'mouseup', 'click', 'dblclick', 'mouseover', 'mousewheel', 'mouseout', 'contextmenu', 'mousemove' ],
			
		// touch events ( TouchEvent ): 
		TouchEvents: ['touchstart', 'touchmove', 'touchend', 'touchcancel'],
			
		// keyboard events ( KeyboardEvent ): 
		KeyboardEvents: ['keydown', 'keypress', 'keyup'],
			
		// form events: 
		FormEvents: ['focus', 'blur', 'change', 'submit'],

	}

	/**
	 * This function allows to override a global default by key or if a object is given as key to override all default at once
	 *
	 * @param {String} key This is the key to override
	 * @param {String|Function|Object} value This is the value to set for the key
	 */
	 function setDefault(key, value){
		//allow setting all defaults
		if (typeof(key) == 'object') {
			_default = key;
			return;
		}

		//set specific default
		_default[key] = value;
	}

	/**
	 * This function returns the value of a default by key or all default if no key is given
	 *
	 * @param {String} key This the key of the default.
	 * @return Returns the current value for a default with a certain key.
	 */
	function getDefault(key){
		// return all defaults if no key is given
		if (!key) return _default;

		// return specific default
		return _default[key];
	}

	function HypeDocumentLoad (hypeDocument, element, event) {
		
		/**
		 * hypeDocument.getSymbolInstance 1.1 (by Stephen, modified by Max Ziebell)
		 * @param {HTMLDivElement} element The starting point for the search
		 * @return {symbolInstance} Is either the symbolInstance or null
		 */
		hypeDocument.getSymbolInstance = function(element){
			var symbolInstance = null;
			while (symbolInstance == null && element != null) {
				symbolInstance = hypeDocument.getSymbolInstanceById(element.id);
				element = element.parentNode;
			} 
			return symbolInstance;
		}
		
		hypeDocument.triggerAction = function (code, options) {
			if (!code) return;
			options = options || {};

			// defaults
			options = Object.assign({
				symbolInstance: hypeDocument.getSymbolInstance(options.element),
				element: document.getElementById(hypeDocument.currentSceneId()),
				event: {}
			}, options);

			var $context;
			var strictMode = options.strictMode || getDefault('StrictMode');

			if (!strictMode) {
				$context={}

				// custom data in context
				if (getDefault('ContextCustomData')) {
					$context = Object.assign($context, hypeDocument.customData);
				}

				// hypeDocument API in context
				if (getDefault('ContextHypeDocument')) {
					$context = Object.assign($context, hypeDocument);
				}

				// symbolInstnace API in context (if possible, first parent)
				if (getDefault('ContextSymbolInstance')) {
					$context = Object.assign($context, options.symbolInstance);
				}

				// Hype Functions bound to current element and event in context
				if (getDefault('ContextHypeFunctions')) {
					var contextHypeFunctions = {} 
					var namesHypeFunctions = Object.keys(hypeDocument.functions());
					if(namesHypeFunctions) namesHypeFunctions.forEach(function(name){
						contextHypeFunctions[name] = function(){
							hypeDocument.functions()[name](hypeDocument, options.element, options.event)
						}
					});

					$context = Object.assign($context, contextHypeFunctions);
				}

			}

			try {
				var functionBody = $context? 'with($context){'+code+'}' : strictMode? '"use strict";'+code: code;
				return Function('$context', '$hype', '$symbol', '$elm', '$event', functionBody)(
					$context, hypeDocument, options.symbolInstance, options.element, options.event
				);
			} catch (e){
				if (getDefault('debug') || isHypePreview()) {
					alert ((options.errorMsg||_extensionName+' Error')+(!options.omitError? ': '+e:'')+"\n\n"+code);
				}
			}
		}

		/* setup firing of user interaction events */
		var DOMEventTypes = Array.prototype.concat.apply([], [
			getDefault('MouseEvents'),
			getDefault('TouchEvents'),
			getDefault('KeyboardEvents'),
			getDefault('FormEvents'),
		]);

		var hypeDocumentElm = document.getElementById(hypeDocument.documentId());

		DOMEventTypes.filter(function(DOMEventType){

			hypeDocumentElm.addEventListener(DOMEventType, function(event){
				var element = event.target;
				var type = event.type;

				if(element && type){
					var code = element.getAttribute('data-'+type+'-action');
					if (code) hypeDocument.triggerAction (code, {
						element: element,
						event:  event
					});
				}
			});
		});
	}


	function registerMatterCollisionEvent(hypeDocument, element, event, engine, eventType, attr){

		// eventType
		if (getDefault('MatterEvents').indexOf(eventType) == -1) return; 
		
		Matter.Events.on(engine, eventType, function(event) {
			var pairs = event.pairs;

			// loop over pairs involved
			for (var i = 0; i < pairs.length; i++) {

				// get a and b participants
				var aElm = document.getElementById(event.pairs[i].bodyA.elementId);
				var bElm = document.getElementById(event.pairs[i].bodyB.elementId);
				
				var code = aElm.getAttribute('data-'+attr+'-action');
				if (code) hypeDocument.triggerAction (code, {
					element: aElm,
					event: Object.assign({
						type: event.name
					}, event)
				});

				var code = bElm.getAttribute('data-'+attr+'-action');
				if (code) hypeDocument.triggerAction (code, {
					element: bElm,
					event: Object.assign({
						type: event.name
					}, event)
				});

			}
		});
	}
	

	function HypeSceneLoad (hypeDocument, element, event) {
		
		// Register Event listener for Matter if mounted
		if (Matter && getDefault('MatterEvents') && getDefault('MatterEvents').length) {
			
			// Fetch physics engine for our hypeDocument
			var hypeDocElm = document.getElementById(hypeDocument.documentId());
			var engine = hypeDocument.getElementProperty(hypeDocElm, 'physics-engine');

			// register matter collision events
			registerMatterCollisionEvent(hypeDocument, element, event, engine, 'collisionStart', 'collision-start');
			registerMatterCollisionEvent(hypeDocument, element, event, engine, 'collisionActive', 'collision-active');
			registerMatterCollisionEvent(hypeDocument, element, event, engine, 'collisionEnd', 'collision-end');
		}

	}


	function HypeSymbolLoad (hypeDocument, element, event) {
		var symbolInstance = hypeDocument.getSymbolInstanceById(element.id);
		if (typeof hypeDocument.functions()[symbolInstance.symbolName()] == 'function'){
			hypeDocument.functions()[symbolInstance.symbolName()](hypeDocument, element, event)
		}
	}
	
	function HypeTriggerCustomBehavior(hypeDocument, element, event) {
		// if a custom behavior seems like JavaScript fire it as an action
		var code = event.customBehaviorName;
		if (/[;=()]/.test(code)) hypeDocument.triggerAction (code, {
			element: element,
			event: event
		});
	}
	
	/* setup callbacks */
	if("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array();}
	window.HYPE_eventListeners.push({"type":"HypeDocumentLoad", "callback": HypeDocumentLoad});
	window.HYPE_eventListeners.push({"type":"HypeSceneLoad", "callback": HypeSceneLoad});
	window.HYPE_eventListeners.push({"type":"HypeSymbolLoad", "callback": HypeSymbolLoad});
	window.HYPE_eventListeners.push({"type":"HypeTriggerCustomBehavior", "callback":HypeTriggerCustomBehavior});

    // window.HYPE_eventListeners.push({"type":"HypeScenePrepareForDisplay", "callback": HypeScenePrepareForDisplay});
	
		
	/**
	 * @typedef {Object} HypeActionEvents
	 * @property {String} version Version of the extension
	 * @property {Function} getDefault Get a default value used in this extension
	 * @property {Function} setDefault Set a default value used in this extension
	 */
	 var HypeActionEvents = {
		version: '1.0.0',
		getDefault: getDefault,
		setDefault: setDefault,
	};

	/** 
	 * Reveal Public interface to window['HypeActionEvents']
	 * return {HypeActionEvents}
	 */
	return HypeActionEvents;
	
})();