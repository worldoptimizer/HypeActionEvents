/*!
Hype Action Events 1.1.1
copyright (c) 2022 Max Ziebell, (https://maxziebell.de). MIT-license
*/

/*
* Version-History
* 1.0.0	Initial release under MIT-license
* 1.0.1 Proxy is default (LegacyMode available), firing HypeActionEvents on HypeDocumentLoad and refactored variables
* 1.0.2 Prioritize user functions over functions in hypeDocument, added events on data-scene-load-action,
        data-scene-unload-action, data-scene-prepare-action and data-layout-request-action
* 1.0.3 Added event functions for ResizeObserver, IntersectionObserver and MutationObserver, 
        changed to passive DOM events, added requestAnimationFrame events, added window and document events
* 1.0.4 Added the event.symbolInstance to Hype function calls if present
* 1.0.5 Fixed typo that prevented collision events to be detected
* 1.0.6 Added hypeDocument, element and event to the triggerAction context, added data-behavior-action
* 1.0.7 Added data-timeline-complete-action, hypeDocument.triggerActionsByAttribute and minor refactoring
* 1.0.8 Bugfix on data-timeline-complete-action for particular timelines
* 1.0.9 Removed blur and focus and added focusin and focusout instead, moved contextmenu, keydown, keypress, keyup 
		and submit events to non passive allowing event.preventDefault(), higher execution order on Hype functions
* 1.1.0 Added hypeDocument.querySelector and hypeDocument.querySelectorAll, minor fixes
* 1.1.1 Added compability for Hype Global Behavior
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

	var _nonPassiveDOMEvents = [
		// dragging
		'drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop', 'contextmenu',

		// keyboard events ( KeyboardEvent ): 
		'keydown', 'keypress', 'keyup',

		// form events: 
		'submit',
		
	];

	var _passiveDOMEvents = [

		// mouse events ( MouseEvent ):
		'mousedown', 'mouseup', 'click', 'dblclick', 'mouseover', 
		'mousewheel', 'mouseout', 'mousemove',

		// touch events ( TouchEvent ): 
		'touchstart', 'touchmove', 'touchend', 'touchcancel',

		// form events: 
		'change', 'input', 'beforeinput',
		'focusin', 'focusout',

		// CSS animations
		'animationstart', 'animationiteration', 'animationend', 'animationcancel',

		// CSS transitions
		'transitionstart', 'transitionrun', 'transitionend', 'transitioncancel',

		// Pointer events
		'pointerdown', 'pointerup', 'pointerover', 'pointerout',
		'pointermove', 'pointerenter', 'pointerleave', 'pointercancel',

	];

	var _functionSignature = [
		'$ctx', '$doc', '$sym', '$elm', '$evt', 'hypeDocument', 'element', 'event'
	];
	
	// defaults
	var _default = {

		debug: false,

		// LegacyMode supports IE, but has less "smart" capabilities
		LegacyMode: false,

		// strict expressions (prevent any context, even more harsh then LegacyMode)
		StrictMode: false,

		// matter events
		MatterEvents: [
			'collisionStart', 'collisionEnd', 'collisionActive'
		],

		// DOM events that are enabled when the Hype Document loads
		DOMEvents: []
			// concat passive Events (they can run indepenndent and not render blocking)
			.concat(_passiveDOMEvents)
			
			// concat nonpassive events (non passive and mostly your able to prevent them)
			.concat(_nonPassiveDOMEvents),

		nonPassiveDOMEvents: _nonPassiveDOMEvents,

		// supported window events
		// https://developer.mozilla.org/en-US/docs/Web/API/Window#events
		WindowEvents: [
			
			// window
			'resize', 'focus', 'blur',
			
			// printing
			'beforeprint', 'afterprint', 
			
			// javascript
			'error', 

			// other
			'storage',

			// connection
			'online', 'offline',

			// history
			'hashchange', 'popstate',

			// communication
			'message', 

			// input
			'wheel'
		],

		// supported document events
		DocumentEvents: [
			'visibilitychange', 'scroll',

			// fullscreen
			'fullscreenchange',

		],
	}



	// variables for document specific observer and instance references
	var _lookup = {}

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
		
		// fetch Hype Document element for event listener
		var hypeDocId = hypeDocument.documentId();
		var hypeDocElm = document.getElementById(hypeDocId);

		//prepare lookup based on document id
		_lookup[hypeDocument.documentId()] = {
			rO: {},
			// Intersection Observer
			iO: {}, 
			// Mutation Observer
			mO: {},
			// Request Animation Frame 
			// - ID
			rAFiD: null,
			// - Scene Frames
			rAFsF: 0,
			// - Total Frames
			rAFtF: 0,
			// window events
			wE: {},
			// document events
			dE: {},
		}

		/* setup firing of user interaction events based on bubbling to Hype Document root */
		getDefault('DOMEvents').forEach(function(DOMEvent){
			hypeDocElm.addEventListener(DOMEvent, function(event){
				var type = event.type;
				var element = event.target.closest('#'+hypeDocId+' [data-'+type+'-action]');
	
				if(element && type){
					var code = element.getAttribute('data-'+type+'-action');
					if (code) hypeDocument.triggerAction (code, {
						element: element,
						event:  event
					});
				}
			}, {passive: getDefault('nonPassiveDOMEvents').indexOf(DOMEvent)==-1});
		});

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
		
		/**
		 * hypeDocument.triggerAction
		 * @param {String} code The code to be executed
		 * @param {Object} options The options for context
		 * @return {*} whatever the code returns
		 */
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
			
			var _hypeFunctions = hypeDocument.functions()

			// unless we are in strict mode prepare context
			if (!strictMode) {
				
				// set default context
				$context = Object.assign(
					// start empty
					{}, 
					// hypeDocument API in context
					hypeDocument,
					// symbolInstnace API in context (if possible, first parent)
					options.symbolInstance
				);
			
				if (getDefault('LegacyMode')) {
					// Hype Functions bound to current element and event in context
					var _boundHypeFunctions = {};
					//var fnc = hypeDocument.functions();
					Object.keys(_hypeFunctions).forEach(function(name){
						_boundHypeFunctions[name] = _hypeFunctions[name].bind(hypeDocument, hypeDocument,  options.element, options.event);
					});
					$context = Object.assign($context, _boundHypeFunctions);

				} else {
					
					// use modern Proxy approach enabling more options
					$context = new Proxy($context, {

						set(target, key, val, receiver) {
							// test if key exists on target
							if (!Reflect.get(target, key, receiver)) {
								// key doesn't exist, assume its a variable in customData we are setting
								return Reflect.set(hypeDocument.customData, key, val)
							}
							// else follow regular behavior
							return Reflect.set(target, key, val, receiver)
						},

						get(target, key, receiver) {
							
							// check if there is a user function and bind it to current hypeDocument, element and event
							var fnc = Reflect.get(_hypeFunctions, key);
							if (fnc) return fnc.bind(hypeDocument, hypeDocument,  options.element, options.event);
							
							// fetch key from target and return it if found
							var value = Reflect.get(target, key, receiver)
							if (value) return value;
							
							// we don't have a value, assume user wants customData
							return Reflect.get(hypeDocument.customData, key)
						},

						has(target, key, receiver) {

							// check if key should walk up the proto chain (hence, break out of proxy), used for arguments in the function signature
							if (_functionSignature.indexOf(key) !== -1) return false;

							// check if there is a user defined hype function and prevail over globals
							if (Reflect.get(_hypeFunctions, key)) return true;

							// check if key doesn't exist on target or in window
							if (!target.hasOwnProperty(key) && !window[key]) { //alternative: && !Reflect.get(window, key, receiver)) {
								// proclaim it exists in target, needed for with-statement
								return true;
							}

							// else follow regular behavior
							return Reflect.has(target, key, receiver)
						},
					});
				}
			}

			// add the symbol instance to the event if set
			if (options.symbolInstance) {
				Object.assign(options.event, {
					symbolInstance: options.symbolInstance
				})
			}

			// trigger action
			try {
				var _functionBody = $context? 'with($ctx){'+code+'}' : strictMode? '"use strict";'+code: code;
				return Function(_functionSignature, _functionBody)(
					/* $ctx */ $context, 
					/* $doc */ hypeDocument, 
					/* $sym */ options.symbolInstance, 
					/* $elm */ options.element, 
					/* $evt */ options.event,
					
					/* since 1.0.6, for code transfer and compability */
					/* hypeDocument */ hypeDocument, 
					/* element */ options.element, 
					/* event */ options.event,
				);

			} catch (e){
				if (getDefault('debug') || isHypePreview()) {
					
					// render error message
					console.error(
						"%c"+(options.errorMsg||_extensionName+' Error')+
						"%c"+(options.errorMsg? '':' version '+HypeActionEvents.version)+"\n\n"+
						"%c"+code+
						(!options.omitError? "%c"+"\n\n"+e+"\n\n": ''),
						 "font-size:12px; font-weight:bold",
						 "font-size:8px",
						 "min-height:40px;display: inline-block; padding: 10px; background-color: rgba(255,255,255,0.25); border: 1px solid lightgray; border-radius: 4px; font-family:Monospace; font-size:12px",
						 "font-size:11px",
						 options.element? options.element : '',
					);
				}
			}
		}
		
		hypeDocument.triggerActionsByAttribute = function(attribute, baseElm, options){
			baseElm = baseElm || document.getElementById(hypeDocument.currentSceneId());
			options = options || {};
			baseElm.querySelectorAll('['+attribute+']').forEach(function(elm){
				var code = elm.getAttribute(attribute);
				if (code) hypeDocument.triggerAction (code, Object.assign({
					element: elm
				}, options));
			});
		}

		hypeDocument.querySelector = function(selector){
			var sceneElm = document.getElementById(hypeDocument.currentSceneId())
			return sceneElm.querySelector(selector);
		}
		
		hypeDocument.querySelectorAll = function(selector){	
			var sceneElm = document.getElementById(hypeDocument.currentSceneId())
			return sceneElm.querySelectorAll(selector);
		}

		// fire HypeActionEvents on HypeDocumentLoad
		if (typeof hypeDocument.functions().HypeActionEvents == 'function'){
			hypeDocument.functions().HypeActionEvents(hypeDocument, element, event);
		}
	}


	function registerMatterCollisionEvent(hypeDocument, element, event, engine, eventType, attr){

		// is eventType actully enabled
		if (getDefault('MatterEvents').indexOf(eventType) == -1) return; 
		
		// Check if scene contains actions for this event type (element assumed sceneElm)
		if (!element.querySelector('[data-'+attr+'-action]')) return;
		
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
		var sceneElm = element;
		var hypeDocId = hypeDocument.documentId();
		var hypeDocElm = document.getElementById(hypeDocId);

		// trigger actions by dataset key
		hypeDocument.triggerActionsByAttribute('data-scene-load-action', element, {
			event: event
		});

		// Register Event listener for Matter if mounted
		if ('Matter' in window != false && getDefault('MatterEvents') && getDefault('MatterEvents').length) {

			// Fetch physics engine for our hypeDocument
			var engine = hypeDocument.getElementProperty(hypeDocElm, 'physics-engine');

			// register matter collision events
			registerMatterCollisionEvent(hypeDocument, element, event, engine, 'collisionStart', 'collision-start');
			registerMatterCollisionEvent(hypeDocument, element, event, engine, 'collisionActive', 'collision-active');
			registerMatterCollisionEvent(hypeDocument, element, event, engine, 'collisionEnd', 'collision-end');
		}

		// Start resize observer
		sceneElm.querySelectorAll('[data-resize-action]').forEach(function(elm){
			if (!_lookup[hypeDocId].rO[elm.id]){
				_lookup[hypeDocId].rO[elm.id] = new ResizeObserver(function(entries, observer){
					var code = elm.getAttribute('data-resize-action');
					if (code) entries.forEach(function(entry, index){
						hypeDocument.triggerAction (code, {
							element: elm,
							event:  {
								type: 'ResizeObserver',
								entry: entry,
								index: index,
								entries: entries,
								observer: observer,
							} 
						});
					})
				});
			}
			var targetSelector = elm.getAttribute('data-resize-target');
			_lookup[hypeDocId].rO[elm.id].observe(targetSelector || elm);
		});

		// Start intersection observer
		sceneElm.querySelectorAll('[data-intersection-action]').forEach(function(elm){
			if (!_lookup[hypeDocId].iO[elm.id]){
				var rootSelector = elm.getAttribute('data-intersection-root');
				var rootMargin = elm.getAttribute('data-intersection-margin');
				var threshold = elm.getAttribute('data-intersection-threshold');
				
				threshold = threshold? threshold.replace(/\s\s+/g,' ').split(' ').map(function(value){
					return value.indexOf('%')!==-1? parseFloat(value)/100 : parseFloat(value);
				}) : getDefault('IntersectionTreshold') || null;

				_lookup[hypeDocId].iO[elm.id] = new IntersectionObserver(function(entries, observer){
					var code = elm.getAttribute('data-intersection-action');
					if (code) entries.forEach(function(entry, index){
						// closest threshold match
						var closestThreshold = 0;
						if (entry.isIntersecting && threshold) {
							closestThreshold = threshold.reduce(function(a, b){
								return Math.abs(b - entry.intersectionRatio) < Math.abs(a - entry.intersectionRatio) ? b : a;
							});
						}

						// fix missing rootBounds bug (like in iFrames)
						if (entry.rootBounds == null) entry.rootBounds = { top: 0, bottom: window.innerHeight }

						var inViewport = entry.boundingClientRect.top <= entry.rootBounds.bottom && entry.boundingClientRect.bottom > entry.rootBounds.top
						var isAbove = entry.boundingClientRect.top < entry.rootBounds.top
						var isBelow = entry.boundingClientRect.bottom > entry.rootBounds.bottom + 1

						hypeDocument.triggerAction (code, {
							element: elm,
							event: {
								type: 'IntersectionObserver',
								entry: entry,
								index: index,
								entries: entries,
								observer: observer,
								closestThreshold: closestThreshold,
								closestThresholdPercent: closestThreshold * 100,
								inViewport: inViewport,
								isAbove: isAbove,
								isBelow: isBelow,	
							}
						});
					});
					
				}, {
					// option root: use a selector (defaults to null = viewport)
					root: sceneElm.querySelector(rootSelector) || null,
					rootMargin: rootMargin || '0px',
					threshold: threshold || null,

				});
			}
			var targetSelector = elm.getAttribute('data-intersection-target');
			_lookup[hypeDocId].iO[elm.id].observe(targetSelector || elm);
		});


		// Start mutation observer
		sceneElm.querySelectorAll('[data-mutation-action]').forEach(function(elm){
			if (!_lookup[hypeDocId].mO[elm.id]){
				_lookup[hypeDocId].mO[elm.id] = new MutationObserver(function(mutations, observer){
					var code = elm.getAttribute('data-mutation-action');
					if (code) mutations.forEach(function(mutation, index){
						hypeDocument.triggerAction (code, {
							element: elm,
							event:  {
								type: 'MutationObserver',
								mutation: mutation,
								index: index,
								mutations: mutations,
								observer: observer,
							} 
						});
					});
				});
			}

			var childList = elm.getAttribute('data-mutation-child-list') == 'true';
			var attributes = elm.getAttribute('data-mutation-attributes') == 'true' || true;
			var characterData = elm.getAttribute('data-mutation-character-data') == 'true';
			var subtree = elm.getAttribute('data-mutation-subtree') == 'true';
			var attributeFilter = elm.getAttribute('data-mutation-attribute-filter');

			attributeFilter = attributeFilter? attributeFilter.split(',').map(function(value){
				return value.trim();
			}) : getDefault('AttributeFilter') || null;

			var config = {
				childList: childList, 
				attributes: attributes,
				characterData: characterData,
				subtree: subtree,
			}
			if (attributeFilter) {
				config.assign(config, {
					attributeFilter: attributeFilter,
				})
			}

			var targetSelector = elm.getAttribute('data-mutation-target');
			_lookup[hypeDocId].mO[elm.id].observe(targetSelector || elm, config);
		});

		// Start request animation events
		var requestAnimationFrameElms = sceneElm.querySelectorAll('[data-animation-frame-action]');
		if (requestAnimationFrameElms) {
			_lookup[hypeDocId].rAFsF = 0;
			var rAFfunction = function(time){
				requestAnimationFrameElms.forEach(function(elm){
					var code = elm.getAttribute('data-animation-frame-action');
					if (code) hypeDocument.triggerAction (code, {
						element: elm,
						event:  {
							type: 'AnimationFrame',
							time: time,
							// increase frame counters
							sceneFrames: _lookup[hypeDocId].rAFsF++,
							totalFrames: _lookup[hypeDocId].rAFtF++,
						} 
					});
				});
				_lookup[hypeDocId].rAFiD = requestAnimationFrame(rAFfunction);
			}
			_lookup[hypeDocId].rAFiD = requestAnimationFrame(rAFfunction);
		}

		// window based effects
		getDefault('WindowEvents').forEach(function(WindowEvent){
			var eventElms = sceneElm.querySelectorAll('[data-window-'+WindowEvent+'-action]')
			if (eventElms) {
				_lookup[hypeDocId].wE[WindowEvent] = function(event){
					var type = event.type;
					eventElms.forEach(function(elm){
						if(elm && type){
							var code = elm.getAttribute('data-window-'+WindowEvent+'-action');
							if (code) hypeDocument.triggerAction (code, {
								element: elm,
								event:  event
							});
						}
					});
				}
				
				window.addEventListener(
					WindowEvent, 
					_lookup[hypeDocId].wE[WindowEvent],
					{passive: true}
				);
			}
		});

		// document based effects
		getDefault('DocumentEvents').forEach(function(DocumentEvent){
			var eventElms = sceneElm.querySelectorAll('[data-document-'+DocumentEvent+'-action]')
			if (eventElms) {
				_lookup[hypeDocId].dE[DocumentEvent] = function(event){
					var type = event.type;
					eventElms.forEach(function(elm){
						if(elm && type){
							var code = elm.getAttribute('data-document-'+DocumentEvent+'-action');
							if (code) hypeDocument.triggerAction (code, {
								element: elm,
								event:  event
							});
						}
					});
				}

				document.addEventListener(
					DocumentEvent, 
					_lookup[hypeDocId].dE[DocumentEvent],
					{passive: true}
				);
			}
		});
	}

	function HypeSceneUnload (hypeDocument, element, event) {
		var hypeDocId = hypeDocument.documentId();

		// trigger actions by dataset key
		hypeDocument.triggerActionsByAttribute('data-scene-unload-action', element, {
			event: event
		});

		// Stop resize observer registered to this document id
		for (var elmId in _lookup[hypeDocId].rO){
			element.querySelectorAll('[data-resize-action]').forEach(function(elm){
				_lookup[hypeDocId].rO[elmId].unobserve(document.getElementById(elm.id));
			});
		}

		// Stop intersection observer registered to this document id
		for (var elmId in _lookup[hypeDocId].iO){
			element.querySelectorAll('[data-intersection-action]').forEach(function(elm){
				_lookup[hypeDocId].iO[elmId].unobserve(document.getElementById(elm.id));
			});
		}

		// Stop mutation observer registered to this document id
		for (var elmId in _lookup[hypeDocId].mO){
			_lookup[hypeDocId].mO[elmId].disconnect();
		}

		// Cancel request animation based events registered to this document id
		if (_lookup[hypeDocId].rAFiD) {
			cancelAnimationFrame(_lookup[hypeDocId].rAFiD);
			_lookup[hypeDocId].rAFiD = null;
		}

		// remove any existing window handler
		getDefault('WindowEvents').forEach(function(WindowEvent){
			if (_lookup[hypeDocId].wE[WindowEvent]) {
				window.removeEventListener(WindowEvent, _lookup[hypeDocId].wE[WindowEvent]);
				delete _lookup[hypeDocId].wE[WindowEvent];
			}
		});

		// remove any existing document handler
		getDefault('DocumentEvents').forEach(function(DocumentEvent){
			if (_lookup[hypeDocId].dE[DocumentEvent]) {
				document.removeEventListener(DocumentEvent, _lookup[hypeDocId].dE[DocumentEvent]);
				delete _lookup[hypeDocId].dE[DocumentEvent];
			}
		});
	}
	
	function HypeScenePrepareForDisplay (hypeDocument, element, event) {
		// trigger actions by dataset key
		hypeDocument.triggerActionsByAttribute('data-scene-prepare-action', element, {
			event: event
		});

	}

	function HypeLayoutRequest (hypeDocument, element, event) {
		// trigger actions by dataset key
		hypeDocument.triggerActionsByAttribute('data-layout-request-action', element, {
			event: event
		});
	}

	function HypeSymbolLoad (hypeDocument, element, event) {
		// check if there is a function with the same name as symbolName and run it
		var sceneElm = document.getElementById(hypeDocument.currentSceneId());
		var symbolInstance = hypeDocument.getSymbolInstanceById(element.id);
		var symbolName = symbolInstance.symbolName();
		if (typeof hypeDocument.functions()[symbolName] == 'function'){
			hypeDocument.functions()[symbolName](hypeDocument, element, Object.assign({
				proactiveEvent: true,
			}, event));
		}

		// trigger actions by dataset key
		hypeDocument.triggerActionsByAttribute('data-symbol-load-action', sceneElm, {
			event: event
		});

		// trigger actions by dataset key, make behavior name compatible with dataset naming (lowercase, spaces to dash)
		var symbolNameSanitized = sanitizeNameForDataset(symbolName);
		hypeDocument.triggerActionsByAttribute('data-symbol-load-'+symbolNameSanitized+'-action', sceneElm, {
			event: event
		});
	}

	function HypeSymbolUnload (hypeDocument, element, event) {
		// check if there is a function with the same name as symbolName and run it
		var sceneElm = document.getElementById(hypeDocument.currentSceneId());
		var symbolInstance = hypeDocument.getSymbolInstanceById(element.id);
		var symbolName = symbolInstance.symbolName();
		if (typeof hypeDocument.functions()[symbolName] == 'function'){
			hypeDocument.functions()[symbolName](hypeDocument, element, Object.assign({
				proactiveEvent: true,
			}, event));
		}

		// trigger actions by dataset key
		hypeDocument.triggerActionsByAttribute('data-symbol-unload-action', sceneElm, {
			event: event
		});
		
		// trigger actions by dataset key, make behavior name compatible with dataset naming (lowercase, spaces to dash)
		var symbolNameSanitized = sanitizeNameForDataset(symbolName);
		hypeDocument.triggerActionsByAttribute('data-symbol-unload-'+symbolNameSanitized+'-action', sceneElm, {
			event: event
		});
	}

	function sanitizeNameForDataset(name){
		return name.replaceAll(/[^a-zA-Z0-9\s]/g, '').replaceAll(/\s+/g, '-').toLowerCase();
	}

	function HypeTriggerCustomBehavior(hypeDocument, element, event) {
		// if a custom behavior seems like JavaScript function fire it as an action
		var code = event.customBehaviorName;
		if (/[;=()]/.test(code)) {
			// if it seems to be an Hype Global Behavior abort
			if (code.charAt(0) == '#') return;
		
			hypeDocument.triggerAction (code, {
				element: element,
				event: event
			});

		// notify elements that want to run actions based on a custom behavior
		} else {
			var sceneElm = document.getElementById(hypeDocument.currentSceneId());

			// trigger actions by dataset key
			hypeDocument.triggerActionsByAttribute('data-behavior-action', sceneElm, {
				event: event
			});
			// trigger actions by dataset key, make behavior name compatible with dataset naming (lowercase, spaces to dash)
			var customBehaviorNameSanitized = sanitizeNameForDataset(event.customBehaviorName);
			hypeDocument.triggerActionsByAttribute('data-behavior-'+customBehaviorNameSanitized+'-action', sceneElm, {
				event: event
			});
		}
	}

	function HypeTimelineComplete(hypeDocument, element, event) {
		
		var sceneElm = document.getElementById(hypeDocument.currentSceneId());

		// trigger actions by dataset key
		hypeDocument.triggerActionsByAttribute('data-timeline-complete-action', sceneElm, {
			event: event
		});
		// trigger actions by dataset key, make timeline name compatible with dataset naming (lowercase, spaces to dash)
		var timelineNameSanitized = sanitizeNameForDataset(event.timelineName);
		hypeDocument.triggerActionsByAttribute('data-timeline-complete-'+timelineNameSanitized+'-action', sceneElm, {
			event: event
		});
	}
	
	/* setup callbacks */
	if("HYPE_eventListeners" in window === false) { window.HYPE_eventListeners = Array();}
	window.HYPE_eventListeners.push({"type":"HypeDocumentLoad", "callback": HypeDocumentLoad});
	window.HYPE_eventListeners.push({"type":"HypeLayoutRequest", "callback": HypeLayoutRequest});
	window.HYPE_eventListeners.push({"type":"HypeScenePrepareForDisplay", "callback": HypeScenePrepareForDisplay});
	window.HYPE_eventListeners.push({"type":"HypeSceneLoad", "callback": HypeSceneLoad});
	window.HYPE_eventListeners.push({"type":"HypeSceneUnload", "callback": HypeSceneUnload});
	window.HYPE_eventListeners.push({"type":"HypeSymbolLoad", "callback": HypeSymbolLoad});
	window.HYPE_eventListeners.push({"type":"HypeSymbolUnload", "callback": HypeSymbolUnload});
	window.HYPE_eventListeners.push({"type":"HypeTriggerCustomBehavior", "callback":HypeTriggerCustomBehavior});
	window.HYPE_eventListeners.push({"type":"HypeTimelineComplete", "callback":HypeTimelineComplete});
		
	/**
	 * @typedef {Object} HypeActionEvents
	 * @property {String} version Version of the extension
	 * @property {Function} getDefault Get a default value used in this extension
	 * @property {Function} setDefault Set a default value used in this extension
	 */
	 var HypeActionEvents = {
		version: '1.1.1',
		getDefault: getDefault,
		setDefault: setDefault,
	};

	/** 
	 * Reveal Public interface to window['HypeActionEvents']
	 * return {HypeActionEvents}
	 */
	return HypeActionEvents;
	
})();
